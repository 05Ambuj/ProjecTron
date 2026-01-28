import { useEffect, useState } from "react";
import { fetchTMProjects } from "../../api/tm";
import type { ProjectDto } from "../../types/adminTypes";
import TaskBoard from "../../components/task/TaskBoard";
import { Columns, FolderKanban, Search, Filter } from "lucide-react";
import { useToast } from "../../contexts/useToast";
import LoadingPage from "../../components/common/LoadingPage";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";

export default function TMTaskBoardPage() {
  const { showError } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Team members should only see their own tasks
  const selectedUserId = user?.userId || "";

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const data = await fetchTMProjects();
        setProjects(data);
        
        // Auto-select first project if available
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].projectId);
        }
      } catch (err) {
        showError(err instanceof Error ? err.message : "Failed to load projects");
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showError]);

  // Filter projects based on search term
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingPage message="Loading projects..." />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Task Board</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Kanban view of your project tasks. Drag and drop tasks to update their status.
            </p>
          </div>
        </header>

        {/* Project Selector Card */}
        {projects.length > 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-2">
                <FolderKanban size={20} className="text-neutral-600" />
                <h2 className="text-sm font-semibold text-neutral-900">Select Project</h2>
              </div>
            </div>
            <div className="p-6">
              {/* Search Projects */}
              {projects.length > 5 && (
                <div className="mb-4">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search projects..."
                      className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}

              {/* Project Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredProjects.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <p className="text-sm text-neutral-500">No projects found matching your search.</p>
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <button
                      key={project.projectId}
                      onClick={() => setSelectedProjectId(project.projectId)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedProjectId === project.projectId
                          ? "border-primary-500 bg-primary-50 shadow-sm"
                          : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-neutral-900 truncate">
                            {project.name}
                          </h3>
                          {project.code && (
                            <p className="text-xs text-neutral-500 mt-0.5">{project.code}</p>
                          )}
                        </div>
                        {selectedProjectId === project.projectId && (
                          <div className="ml-2 shrink-0">
                            <div className="w-2 h-2 rounded-full bg-primary-600"></div>
                          </div>
                        )}
                      </div>
                      {project.description && (
                        <p className="text-xs text-neutral-600 line-clamp-2 mt-2">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500">
                        <span>
                          {project.progressPercentage || 0}% Complete
                        </span>
                        {project.status !== undefined && (
                          <span className={`px-2 py-0.5 rounded ${
                            project.status === 1
                              ? "bg-blue-100 text-blue-700"
                              : project.status === 2
                              ? "bg-green-100 text-green-700"
                              : project.status === 3
                              ? "bg-yellow-100 text-yellow-700"
                              : project.status === 4
                              ? "bg-emerald-100 text-emerald-700"
                              : project.status === 5
                              ? "bg-red-100 text-red-700"
                              : "bg-neutral-100 text-neutral-700"
                          }`}>
                            {project.status === 1
                              ? "Planned"
                              : project.status === 2
                              ? "In Progress"
                              : project.status === 3
                              ? "On Hold"
                              : project.status === 4
                              ? "Completed"
                              : project.status === 5
                              ? "Cancelled"
                              : "Unknown"}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty State - No Projects */}
        {projects.length === 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-12 text-center">
            <FolderKanban size={48} className="mx-auto text-neutral-300 mb-4" />
            <p className="text-sm font-medium text-neutral-900 mb-1">No projects assigned</p>
            <p className="text-sm text-neutral-500">
              You're not assigned to any projects yet. Contact your project manager to get assigned to a project.
            </p>
          </div>
        )}

        {/* Empty State - No Project Selected */}
        {projects.length > 0 && !selectedProjectId && (
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-12 text-center">
            <Columns size={48} className="mx-auto text-neutral-300 mb-4" />
            <p className="text-sm font-medium text-neutral-900 mb-1">Select a project</p>
            <p className="text-sm text-neutral-500">
              Choose a project from above to view its task board
            </p>
          </div>
        )}

        {/* Task Board */}
        {selectedProjectId && (
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Columns size={20} className="text-neutral-600" />
                  <h2 className="text-sm font-semibold text-neutral-900">
                    {projects.find((p) => p.projectId === selectedProjectId)?.name || "Task Board"}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Filter size={14} />
                  <span>Drag tasks between columns to update status</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <TaskBoard 
                projectId={selectedProjectId} 
                selectedUserId={selectedUserId}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
