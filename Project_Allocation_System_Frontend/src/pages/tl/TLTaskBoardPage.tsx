import { useEffect, useState } from "react";
import { fetchTLProjects, fetchTLAssignableUsers } from "../../api/tl";
import type { ProjectDto } from "../../types/adminTypes";
import type { UserDto } from "../../types/userTypes";
import TaskBoard from "../../components/task/TaskBoard";
import { Columns, FolderKanban, Search, Filter, User } from "lucide-react";
import { useToast } from "../../contexts/useToast";
import LoadingPage from "../../components/common/LoadingPage";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";

export default function TLTaskBoardPage() {
  const { showError } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [availableUsers, setAvailableUsers] = useState<UserDto[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const data = await fetchTLProjects();
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

  // Load users for filtering (only for Team Leads and above)
  useEffect(() => {
    async function loadUsers() {
      if (!selectedProjectId || !user) return;
      
      // Team Members (role 4) should only see their own tasks - no filter needed
      if (user.role === 4) {
        setSelectedUserId(user.userId || "");
        setAvailableUsers([]);
        return;
      }

      // Team Leads (role 3) and above can filter by user
      if (user.role === 3 || user.role === 2 || user.role === 1) {
        try {
          setLoadingUsers(true);
          const data = await fetchTLAssignableUsers({
            projectId: selectedProjectId,
            page: 1,
            pageSize: 100,
          });
          setAvailableUsers(data.items);
          
          // Add "All Users" option
          setAvailableUsers((prev) => [
            { userId: "", displayName: "All Users", email: "" } as UserDto,
            ...prev,
          ]);
        } catch (err) {
          console.error("Failed to load users:", err);
          setAvailableUsers([]);
        } finally {
          setLoadingUsers(false);
        }
      }
    }

    loadUsers();
  }, [selectedProjectId, user]);

  // Auto-filter to own tasks for Team Members
  useEffect(() => {
    if (user && user.role === 4) {
      setSelectedUserId(user.userId || "");
    } else {
      // For Team Leads and above, default to "All Users"
      setSelectedUserId("");
    }
  }, [user]);

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
                      className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          ? "border-blue-500 bg-blue-50 shadow-sm"
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
                            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
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
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Columns size={20} className="text-neutral-600" />
                  <h2 className="text-sm font-semibold text-neutral-900">
                    {projects.find((p) => p.projectId === selectedProjectId)?.name || "Task Board"}
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  {/* User Filter - Only for Team Leads and above */}
                  {(user?.role === 3 || user?.role === 2 || user?.role === 1) && availableUsers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-neutral-500" />
                      <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        disabled={loadingUsers}
                      >
                        {availableUsers.map((u) => (
                          <option key={u.userId || "all"} value={u.userId || ""}>
                            {u.displayName || u.email || "All Users"}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Filter size={14} />
                    <span>Click tasks to view details</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <TaskBoard 
                projectId={selectedProjectId} 
                selectedUserId={selectedUserId || undefined}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
