import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, FolderKanban } from "lucide-react";
import { fetchTLProjects } from "../../api/tl";
import { useToast } from "../../contexts/useToast";
import LoadingPage from "../../components/common/LoadingPage";
import type { ProjectDto } from "../../types/adminTypes";

export default function TLProjectDetailsReadOnlyPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { showError } = useToast();
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!projectId) return;
      try {
        setLoading(true);
        // Backend restricts TL/TM project access, so list+find is safe and typed
        const projects = await fetchTLProjects();
        const found = projects.find((p) => p.projectId === projectId) ?? null;
        if (!cancelled) setProject(found);
      } catch (err) {
        if (!cancelled) showError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId, showError]);

  if (loading) return <LoadingPage message="Loading project..." />;

  if (!project) {
    return (
      <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
        <FolderKanban size={48} className="mx-auto text-neutral-300 mb-4" />
        <p className="text-sm font-medium text-neutral-900 mb-1">Project not found</p>
        <p className="text-sm text-neutral-500">
          You may not be assigned to this project.
        </p>
        <div className="mt-6">
          <Link
            to="/tl/projects"
            className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900"
          >
            <ArrowLeft size={16} />
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <Link
          to="/tl/projects"
          className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft size={16} />
          Back to projects
        </Link>
        <span className="text-xs px-2 py-1 rounded-full border bg-neutral-50 text-neutral-700">
          Read-only
        </span>
      </header>

      <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary-50">
            <FolderKanban size={24} className="text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-mono text-neutral-500">{project.code}</div>
            <h1 className="text-2xl font-bold text-neutral-900 truncate">{project.name}</h1>
            {project.description && (
              <p className="mt-2 text-sm text-neutral-700 whitespace-pre-wrap">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg border border-neutral-200 p-4">
            <div className="text-xs text-neutral-500">Organization</div>
            <div className="font-medium text-neutral-900">{project.organizationName || "N/A"}</div>
          </div>
          <div className="rounded-lg border border-neutral-200 p-4">
            <div className="text-xs text-neutral-500">Project Manager</div>
            <div className="font-medium text-neutral-900">{project.projectManagerName || "N/A"}</div>
          </div>
          <div className="rounded-lg border border-neutral-200 p-4">
            <div className="text-xs text-neutral-500">Dates</div>
            <div className="font-medium text-neutral-900">
              {project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A"} –{" "}
              {project.endDate ? new Date(project.endDate).toLocaleDateString() : "N/A"}
            </div>
          </div>
          <div className="rounded-lg border border-neutral-200 p-4">
            <div className="text-xs text-neutral-500">Progress</div>
            <div className="font-medium text-neutral-900">{project.progressPercentage || 0}%</div>
          </div>
        </div>

        {/* Documents (read-only placeholder) */}
        <div className="mt-6 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6">
          <div className="font-medium text-neutral-800 mb-1">Project documents</div>
          <p className="text-xs text-neutral-500 mb-2">
            Specifications, designs, test plans, and other shared files.
          </p>
          <p className="text-xs text-neutral-500">
            Document uploads are managed by the Project Manager or Admin.
          </p>
        </div>
      </div>
    </div>
  );
}

