import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchPMProjects } from "../../features/pm/pmSlice";
import {
  FolderKanban,
  Calendar,
  DollarSign,
} from "lucide-react";
import { UserRole } from "../../constants/roles";
import LoadingPage from "../../components/common/LoadingPage";
import type { ProjectDto } from "../../types/adminTypes";

// Backend enums (ProjectStatus): Planned=1, InProgress=2, OnHold=3, Completed=4, Cancelled=5
const STATUS_COLORS: Record<number, { label: string; color: string }> = {
  1: { label: "Planned", color: "bg-slate-100 text-slate-700 border-slate-200" },
  2: { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200" },
  3: { label: "On Hold", color: "bg-amber-100 text-amber-700 border-amber-200" },
  4: { label: "Completed", color: "bg-green-100 text-green-700 border-green-200" },
  5: { label: "Cancelled", color: "bg-red-100 text-red-700 border-red-200" },
};

function ProjectCard({ project, onClick }: { project: ProjectDto; onClick: () => void }) {
  const getStatusBadge = (status: number) => {
    const statusInfo = STATUS_COLORS[status] || { label: "Unknown", color: "bg-neutral-100 text-neutral-700 border-neutral-200" };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  // Backend enums (ProjectPriority): Low=1, Medium=2, High=3, Critical=4
  const getPriorityBadge = (priority: number) => {
    const priorityMap: Record<number, { label: string; color: string }> = {
      1: { label: "Low", color: "bg-green-50 text-green-700" },
      2: { label: "Medium", color: "bg-blue-50 text-blue-700" },
      3: { label: "High", color: "bg-orange-50 text-orange-700" },
      4: { label: "Critical", color: "bg-red-50 text-red-700" },
    };
    const priorityInfo = priorityMap[priority] || { label: "Unknown", color: "bg-neutral-50 text-neutral-700" };
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityInfo.color}`}>
        {priorityInfo.label}
      </span>
    );
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      onClick={onClick}
      className="group relative rounded-xl bg-white border border-neutral-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-100">
        <div
          className="h-full bg-primary-600 transition-all"
          style={{ width: `${project.progressPercentage || 0}%` }}
        />
      </div>

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="p-3 rounded-xl bg-primary-50 group-hover:bg-primary-100 transition-colors">
              <FolderKanban size={24} className="text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-neutral-500">{project.code}</span>
                {getPriorityBadge(project.priority)}
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-1 truncate">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-sm text-neutral-600 line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          <div className="ml-2">
            {getStatusBadge(project.status)}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-neutral-700">Progress</span>
            <span className="text-xs font-semibold text-neutral-900">
              {project.progressPercentage || 0}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all"
              style={{ width: `${project.progressPercentage || 0}%` }}
            />
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-50">
              <Calendar size={16} className="text-neutral-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Start Date</p>
              <p className="text-sm font-medium text-neutral-900 truncate">
                {formatDate(project.startDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-50">
              <DollarSign size={16} className="text-neutral-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Budget</p>
              <p className="text-sm font-medium text-neutral-900 truncate">
                ${project.budget?.toLocaleString() || "0"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PMProjectsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { projects, loading } = useSelector((state: RootState) => state.pm);
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);

  const [page] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    if (!user || !token || user.role !== UserRole.ProjectManager) return;
    
    dispatch(fetchPMProjects({ page, pageSize, actorRole: user.role as UserRole }));
  }, [dispatch, page, pageSize, user]);

  if (loading) {
    return <LoadingPage message="Loading projects..." />;
  }

  const projectList: ProjectDto[] = Array.isArray(projects) ? projects : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">My Projects</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Manage and monitor your assigned projects
          </p>
        </div>
      </header>

      {/* Stats Bar */}
      {projectList.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-primary-50 border border-primary-200">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-sm text-primary-700">Total Projects: </span>
              <span className="text-sm font-semibold text-primary-900">{projectList.length.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {projectList.length === 0 ? (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <FolderKanban size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-sm font-medium text-neutral-900 mb-1">
            No projects assigned
          </p>
          <p className="text-sm text-neutral-500">
            You don't have any projects assigned to you yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectList.map((project) => (
            <ProjectCard
              key={project.projectId}
              project={project}
              onClick={() => navigate(`/pm/projects/${project.projectId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}