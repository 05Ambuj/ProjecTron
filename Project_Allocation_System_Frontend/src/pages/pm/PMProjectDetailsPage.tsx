import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchPMProjectById, fetchProjectAllocations } from "../../features/pm/pmSlice";
import { updatePMProject } from "../../api/pm";
import type { ProjectDto } from "../../types/adminTypes";
import { UserRole } from "../../constants/roles";
import LoadingPage from "../../components/common/LoadingPage";
import { useToast } from "../../contexts/useToast";
import {
  ArrowLeft,
  FolderKanban,
  Calendar,
  Users,
  Zap,
  CheckSquare,
  Building2,
  Clock,
  ArrowRight,
  FileText,
  UserCircle2,
  Scale,
} from "lucide-react";

const STATUS_LABELS: Record<number, string> = {
  1: "Planned",
  2: "In Progress",
  3: "On Hold",
  4: "Completed",
  5: "Cancelled",
};

const STATUS_COLORS: Record<number, string> = {
  0: "bg-slate-100 text-slate-700 border-slate-200",
  1: "bg-blue-100 text-blue-700 border-blue-200",
  2: "bg-amber-100 text-amber-700 border-amber-200",
  3: "bg-green-100 text-green-700 border-green-200",
  4: "bg-red-100 text-red-700 border-red-200",
};

const PRIORITY_LABELS: Record<number, string> = {
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Critical",
};

const PRIORITY_COLORS: Record<number, string> = {
  0: "bg-green-100 text-green-700 border-green-200",
  1: "bg-blue-100 text-blue-700 border-blue-200",
  2: "bg-amber-100 text-amber-700 border-amber-200",
  3: "bg-red-100 text-red-700 border-red-200",
};

export default function PMProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { currentProject, loading, allocations } = useSelector((state: RootState) => state.pm);
  const user = useSelector((state: RootState) => state.auth.user);
  const { showError, showSuccess } = useToast();

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [draft, setDraft] = useState<ProjectDto | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'project' | 'team'>('project');
  const navigate = useNavigate();

  useEffect(() => {
    if (projectId && user) {
      dispatch(fetchPMProjectById({ projectId, actorRole: user.role as UserRole }));
      dispatch(fetchProjectAllocations(projectId));
    }
  }, [dispatch, projectId, user]);

  useEffect(() => {
    if (currentProject) {
      setProject(currentProject);
      setDraft({ ...currentProject });
    }
  }, [currentProject]);

  const hasChanges = useMemo(() => {
    if (!project || !draft) return false;
    return JSON.stringify(project) !== JSON.stringify(draft);
  }, [project, draft]);

  async function saveChanges() {
    if (!draft || !projectId || !user) return;

    const payload = {
      name: draft.name,
      description: draft.description ?? "",
      status: draft.status,
      priority: draft.priority,
      startDate: draft.startDate,
      endDate: draft.endDate,
      budget: draft.budget ?? 0,
      maxAllocations: draft.maxAllocations,
    };

    try {
      setSaving(true);
      setError(null);

      if (new Date(draft.endDate) < new Date(draft.startDate)) {
        setError("End date cannot be earlier than start date");
        return;
      }

      const updated = await updatePMProject(projectId, payload, user.role as UserRole);
      setProject(updated);
      setDraft(updated);
      setConfirmOpen(false);
      showSuccess("Project updated successfully");
      
      // Refresh the project in Redux store
      dispatch(fetchPMProjectById({ projectId, actorRole: user.role as UserRole }));
    } catch (e) {
      const errorMessage = (e as Error).message || "Failed to update project";
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingPage message="Loading project..." />;
  }

  if (!project || !draft) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="bg-white border border-neutral-300 rounded-xl p-6 shadow-sm">
          <p className="text-sm text-neutral-600">Project not found</p>
        </div>
      </div>
    );
  }

  const progress = draft.progressPercentage || 0;
  const teamLead = allocations.find((a) => a.role === UserRole.TeamLead);
  const teamMembers = allocations.filter((a) => a.role === UserRole.TeamMember);
  const maxAllocations = draft?.maxAllocations ?? 0;
  const maxAllocationsLabel = maxAllocations > 0 ? `${maxAllocations}` : "Not set";

  // Debug logging
  console.log('PM Allocations:', allocations);
  console.log('PM Team lead:', teamLead);
  console.log('PM Team members:', teamMembers);
  console.log('PM Allocations raw:', allocations.map(a => ({ ...a, role: a.role })));

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-0">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate("/pm/projects")}
        className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to projects
      </button>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Header */}
      <header className="rounded-xl bg-white border border-neutral-200 shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2.5 rounded-xl bg-primary-50 flex-shrink-0">
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
                {draft.code} · {draft.organizationName || "N/A"}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0 ml-4">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                STATUS_COLORS[draft.status] || "bg-neutral-100 text-neutral-700 border-neutral-200"
              }`}
            >
              {STATUS_LABELS[draft.status] || `Status ${draft.status}`}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                PRIORITY_COLORS[draft.priority] || "bg-neutral-100 text-neutral-700 border-neutral-200"
              }`}
            >
              {PRIORITY_LABELS[draft.priority] || `Priority ${draft.priority}`}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-neutral-700">Project Progress</span>
            <span className="text-xs font-semibold text-neutral-900">{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      {/* Layout: Main Content + Sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tasks Link */}
          <Section title="Tasks">
            <Link
              to={`/pm/tasks/all?projectId=${projectId}`}
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

          {/* Project Description */}
          <Section title="Project Description">
            <textarea
              className="min-h-64 w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              placeholder="Describe scope, objectives, risks, dependencies, milestones, and expectations…"
              value={draft.description ?? ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </Section>

          {/* Quick Actions & Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Quick Actions - 2 columns */}
            <div className="md:col-span-2">
              <Section title="Quick Actions">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ActionLink
                    to="/pm/teams"
                    icon={Users}
                    label="Manage Teams"
                    description="Manage teams, leads and members"
                  />
                  <ActionLink
                    to={`/pm/sprints/planning?projectId=${projectId}`}
                    icon={Zap}
                    label="Plan Sprint"
                    description="Create and manage sprints"
                  />
                  <ActionLink
                    to={`/pm/tasks/all?projectId=${projectId}`}
                    icon={CheckSquare}
                    label="All Tasks"
                    description="View and filter tasks"
                  />
                  <div className="p-3 rounded-lg border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-neutral-100">
                        <FileText size={18} className="text-neutral-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-neutral-900">Documents</h3>
                        <p className="text-xs text-neutral-600">Coming soon</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Section>
            </div>

            {/* Project Stats */}
            <Section title="Project Stats">
              <div className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                  <div className="text-2xl font-bold text-blue-700">
                    {Math.round(draft.progressPercentage || 0)}%
                  </div>
                  <div className="text-xs text-blue-600 font-medium">Complete</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                  <div className="text-2xl font-bold text-green-700">
                    {allocations.length}
                  </div>
                  <div className="text-xs text-green-600 font-medium">Team Members</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100">
                  <div className="text-2xl font-bold text-amber-700">
                    {maxAllocations > 0 ? maxAllocations : '∞'}
                  </div>
                  <div className="text-xs text-amber-600 font-medium">Max Allocations</div>
                </div>
              </div>
            </Section>
          </div>
        </div>

        {/* Sidebar */}
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
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-3">
                <InfoRow
                  label="Team Lead"
                  value={teamLead ? teamLead.userName : "Unassigned"}
                  icon={UserCircle2}
                />
                <InfoRow
                  label="Team Members"
                  value={`${teamMembers.length} member${teamMembers.length === 1 ? "" : "s"}`}
                  icon={Users}
                />
                <InfoRow
                  label="Allocation Limit"
                  value={maxAllocationsLabel}
                  icon={Scale}
                />
                <Link
                  to="/pm/teams"
                  className="inline-flex items-center gap-2 text-sm text-primary-700 hover:text-primary-900 font-medium mt-2"
                >
                  Manage Teams
                  <ArrowRight size={14} />
                </Link>
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
                  onChange={(e) => setDraft({ ...draft, budget: Number(e.target.value) })}
                />
              </div>
            </div>
          </Section>

          {/* Allocation Limit */}
          <Section title="Allocation Limit">
            <Label>Max Allocations (Team Lead + Members)</Label>
            <input
              type="number"
              min={0}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              value={draft.maxAllocations ?? 0}
              onChange={(e) =>
                setDraft({ ...draft, maxAllocations: Number(e.target.value) || 0 })
              }
            />
            <p className="text-xs text-neutral-500 mt-2">
              Set to 0 to block new allocations; set a positive number to allow team assignments.
            </p>
          </Section>
        </div>
      </div>

      {/* Save Bar */}
      {hasChanges && (
        <div className="sticky bottom-0 z-40 border-t border-neutral-200 bg-white shadow-lg">
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

      {/* Confirm Modal */}
      {confirmOpen && (
        <ConfirmModal
          loading={saving}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={saveChanges}
        />
      )}
    </div>
  );
}

/* ============================================================
   UI Components
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
      <div className="p-1.5 rounded-lg bg-primary-50 mt-0.5 flex-shrink-0">
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

function ActionLink({
  to,
  icon: Icon,
  label,
  description,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-3 hover:border-primary-300 hover:shadow-sm transition-all duration-200"
    >
      <div className="p-1.5 rounded-lg bg-primary-50 group-hover:bg-primary-100 transition-colors flex-shrink-0">
        <Icon size={16} className="text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-neutral-900 mb-0.5">
          {label}
        </h3>
        <p className="text-xs text-neutral-600">
          {description}
        </p>
      </div>
      <ArrowRight size={14} className="text-neutral-400 group-hover:text-primary-600 transition-colors flex-shrink-0" />
    </Link>
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
