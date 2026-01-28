import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Zap, Calendar } from "lucide-react";
import type { SprintDTO } from "../../types/sprintTypes";
import { useToast } from "../../contexts/useToast";
import LoadingPage from "../../components/common/LoadingPage";
import { fetchTLProjects } from "../../api/tl";
import type { ProjectDto } from "../../types/adminTypes";
import api from "../../api/client";
import type { RootState } from "../../app/store";
import { UserRole } from "../../constants/roles";

const STATUS_LABELS: Record<number, string> = {
  0: "Planned",
  1: "Active",
  2: "Completed",
  3: "Cancelled",
};

const STATUS_COLORS: Record<number, string> = {
  0: "bg-slate-100 text-slate-700 border-slate-200",
  1: "bg-blue-100 text-blue-700 border-blue-200",
  2: "bg-green-100 text-green-700 border-green-200",
  3: "bg-red-100 text-red-700 border-red-200",
};

function SprintCard({ sprint, onNavigate }: { sprint: SprintDTO; onNavigate: () => void }) {
  return (
    <button
      onClick={onNavigate}
      className="text-left rounded-xl bg-white border border-neutral-200 shadow-sm p-6 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-xl bg-primary-50">
            <Zap size={20} className="text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-neutral-900 truncate">{sprint.name}</h3>
              {sprint.status === 1 && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  <Zap size={10} />
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 truncate">{sprint.projectName}</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[sprint.status] || "bg-neutral-100 text-neutral-700 border-neutral-200"}`}>
          {STATUS_LABELS[sprint.status]}
        </span>
      </div>

      <p className="text-sm text-neutral-700 mb-4 line-clamp-2">{sprint.goals}</p>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-700">Progress</span>
          <span className="text-xs font-semibold text-neutral-900">
            {sprint.completedStoryPoints}/{sprint.totalStoryPoints} SP
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-full bg-primary-600 transition-all"
            style={{ width: `${sprint.progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-neutral-600">
        <Calendar size={14} />
        <span>
          {new Date(sprint.startDate).toLocaleDateString()} -{" "}
          {new Date(sprint.endDate).toLocaleDateString()}
        </span>
      </div>
    </button>
  );
}

export default function TLSprintsPage() {
  const navigate = useNavigate();
  const { showError } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const [sprints, setSprints] = useState<SprintDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Get the correct route prefix based on user role
  const getRoutePrefix = () => {
    if (!user) return "/tl";
    switch (user.role) {
      case UserRole.TeamLead:
        return "/tl";
      case UserRole.TeamMember:
        return "/tm";
      default:
        return "/tl";
    }
  };

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await fetchTLProjects();
        setProjects(data);
      } catch {
        // Ignore
      }
    }
    loadProjects();
  }, []);

  useEffect(() => {
    async function loadSprints() {
      if (!selectedProjectId) {
        setSprints([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await api.get(`/sprints/project/${selectedProjectId}`);
        if (res.data.success && res.data.data) {
          setSprints(Array.isArray(res.data.data) ? res.data.data : []);
        }
      } catch {
        showError("Failed to load sprints");
        setSprints([]);
      } finally {
        setLoading(false);
      }
    }

    loadSprints();
  }, [selectedProjectId, showError]);

  const activeSprints = sprints.filter((s) => s.status === 1);

  if (loading) {
    return <LoadingPage message="Loading sprints..." />;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Active Sprints</h1>
          <p className="mt-2 text-sm text-neutral-600">
            View sprints for your assigned projects (read-only)
          </p>
        </div>
      </header>

      {projects.length > 0 && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Filter by Project
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full md:w-1/3 px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select a project...</option>
            {projects.map((project) => (
              <option key={project.projectId} value={project.projectId}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!selectedProjectId && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <Zap size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-sm font-medium text-neutral-900 mb-1">Select a project</p>
          <p className="text-sm text-neutral-500">Choose a project to view its sprints</p>
        </div>
      )}

      {selectedProjectId && sprints.length === 0 && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <Zap size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-sm font-medium text-neutral-900 mb-1">No sprints found</p>
        </div>
      )}

      {activeSprints.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeSprints.map((sprint) => (
            <SprintCard
              key={sprint.sprintId}
              sprint={sprint}
              onNavigate={() => navigate(`${getRoutePrefix()}/sprints/${sprint.sprintId}/stats`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
