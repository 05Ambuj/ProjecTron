import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban } from "lucide-react";
import { fetchTLProjects } from "../../api/tl";
import { useToast } from "../../contexts/useToast";
import LoadingPage from "../../components/common/LoadingPage";
import type { ProjectDto } from "../../types/adminTypes";

export default function TLProjectsPage() {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadProjects() {
      try {
        setLoading(true);
        const data = await fetchTLProjects();
        if (!cancelled) setProjects(data);
      } catch (err) {
        if (!cancelled) {
          showError(err instanceof Error ? err.message : "Failed to load projects");
          setProjects([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProjects();
    return () => {
      cancelled = true;
    };
  }, [showError]);

  if (loading) {
    return <LoadingPage message="Loading projects..." />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-neutral-900">My Projects</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Projects you're assigned to • {projects.length} total
        </p>
      </header>

      {projects.length === 0 ? (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <FolderKanban size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-sm font-medium text-neutral-900 mb-1">No projects assigned</p>
          <p className="text-sm text-neutral-500">
            You're not assigned to any projects yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <button
              key={project.projectId}
              onClick={() => navigate(`/tl/projects/${project.projectId}`)}
              className="group relative rounded-xl bg-white border border-neutral-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden text-left"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-100">
                <div
                  className="h-full bg-primary-600 transition-all"
                  style={{ width: `${project.progressPercentage || 0}%` }}
                />
              </div>

              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-primary-50 group-hover:bg-primary-100 transition-colors">
                    <FolderKanban size={24} className="text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-neutral-500">{project.code}</span>
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

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-neutral-700">Progress</span>
                    <span className="text-xs font-semibold text-neutral-900">
                      {project.progressPercentage || 0}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-neutral-100">
                    <div
                      className="h-full bg-primary-600 transition-all"
                      style={{ width: `${project.progressPercentage || 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-600">
                  <span>{project.organizationName || "N/A"}</span>
                  <span>{project.projectManagerName || "Unassigned"}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

