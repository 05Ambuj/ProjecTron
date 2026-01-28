import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  User,
  Building2,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { fetchAdminProjects } from "../../api/admin";
import type { ProjectDto } from "../../types/adminTypes";
import type { PagedResponse } from "../../types/userTypes";
import { useToast } from "../../contexts/useToast";
import LoadingPage from "../../components/common/LoadingPage";

const PAGE_SIZE = 10;

function ProjectCard({ project, onClick }: { project: ProjectDto; onClick: () => void }) {
  const getStatusBadge = (status: number) => {
    const statusMap: Record<number, { label: string; color: string }> = {
      1: { label: "Planned", color: "bg-slate-100 text-slate-700 border-slate-200" },
      2: { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200" },
      3: { label: "On Hold", color: "bg-amber-100 text-amber-700 border-amber-200" },
      4: { label: "Completed", color: "bg-green-100 text-green-700 border-green-200" },
      5: { label: "Cancelled", color: "bg-red-100 text-red-700 border-red-200" },
    };
    const statusInfo = statusMap[status] || { label: "Unknown", color: "bg-neutral-100 text-neutral-700 border-neutral-200" };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

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
              <User size={16} className="text-neutral-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Manager</p>
              <p className="text-sm font-medium text-neutral-900 truncate">
                {project.projectManagerName || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-50">
              <Building2 size={16} className="text-neutral-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Organization</p>
              <p className="text-sm font-medium text-neutral-900 truncate">
                {project.organizationName || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-4 text-xs text-neutral-600">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>Start: {formatDate(project.startDate)}</span>
            </div>
            {project.endDate && (
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                <span>End: {formatDate(project.endDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { showError } = useToast();

  const [projects, setProjects] = useState<PagedResponse<ProjectDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(PAGE_SIZE);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>("createdDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const filters: {
        searchTerm?: string;
        status?: number;
        priority?: number;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
      } = {};

      if (searchTerm) filters.searchTerm = searchTerm;
      if (statusFilter !== null) filters.status = statusFilter;
      if (priorityFilter !== null) filters.priority = priorityFilter;
      if (sortBy) filters.sortBy = sortBy;
      if (sortOrder) filters.sortOrder = sortOrder;

      const data = await fetchAdminProjects(page, pageSize, filters);
      setProjects(data);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Failed to load projects");
      setProjects(null);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, statusFilter, priorityFilter, sortBy, sortOrder, showError]);

  // Debounce search input
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      loadProjects();
    }, 500); // 500ms debounce

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchTerm, loadProjects]);

  // Load projects when filters (except search) or page changes
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    loadProjects();
  }, [page, statusFilter, priorityFilter, sortBy, sortOrder, loadProjects]);

  // Reset to page 1 when filters change (except page itself)
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, priorityFilter, sortBy, sortOrder]);

  const hasActiveFilters = searchTerm !== "" || statusFilter !== null || priorityFilter !== null;
  const totalPages = projects ? Math.ceil(projects.totalCount / pageSize) : 0;

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter(null);
    setPriorityFilter(null);
    setSortBy("createdDate");
    setSortOrder("desc");
  };

  if (loading) {
    return <LoadingPage message="Loading projects..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Projects</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Manage and monitor all projects across organizations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadProjects}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 transition-colors"
          >
            <RefreshCw size={16} className="text-neutral-600" />
            <span className="text-sm font-medium text-neutral-700">Refresh</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? "border-primary-300 bg-primary-50 text-primary-700"
                : "border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700"
            }`}
          >
            <Filter size={16} />
            <span className="text-sm font-medium">Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-neutral-900 text-white text-xs">
                {[searchTerm, statusFilter, priorityFilter].filter(Boolean).length}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate("/admin/projects/new")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Create Project</span>
          </button>
        </div>
      </header>

      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, code, or description..."
                  className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter ?? ""}
                onChange={(e) => setStatusFilter(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="1">Planned</option>
                <option value="2">In Progress</option>
                <option value="3">On Hold</option>
                <option value="4">Completed</option>
                <option value="5">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Priority
              </label>
              <select
                value={priorityFilter ?? ""}
                onChange={(e) => setPriorityFilter(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Priorities</option>
                <option value="1">Low</option>
                <option value="2">Medium</option>
                <option value="3">High</option>
                <option value="4">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="createdDate">Created Date</option>
                <option value="name">Name</option>
                <option value="code">Code</option>
                <option value="status">Status</option>
                <option value="priority">Priority</option>
                <option value="progressPercentage">Progress</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Sort Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors"
              >
                <X size={16} />
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats Bar */}
      {projects && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-primary-50 border border-primary-200">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-sm text-primary-700">Total Projects: </span>
              <span className="text-sm font-semibold text-primary-900">{projects.totalCount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-sm text-primary-700">Showing: </span>
              <span className="text-sm font-semibold text-primary-900">
                {((page - 1) * pageSize + 1).toLocaleString()} -{" "}
                {Math.min(page * pageSize, projects.totalCount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-sm text-neutral-600">Loading projects...</p>
        </div>
      ) : !projects || projects.items.length === 0 ? (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <FolderKanban size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-sm font-medium text-neutral-900 mb-1">
            {hasActiveFilters ? "No projects match your filters" : "No projects found"}
          </p>
          <p className="text-sm text-neutral-500 mb-4">
            {hasActiveFilters ? "Try adjusting your search or filters" : "Get started by creating your first project"}
          </p>
          {!hasActiveFilters && (
            <button
              onClick={() => navigate("/admin/projects/new")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
            >
              <Plus size={16} />
              Create Project
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.items.map((project) => (
              <ProjectCard
                key={project.projectId}
                project={project}
                onClick={() => navigate(`/admin/projects/${project.projectId}`)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-white border border-neutral-200">
              <div className="text-sm text-neutral-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} className="text-neutral-600" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          page === pageNum
                            ? "bg-neutral-900 text-white"
                            : "bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-300"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} className="text-neutral-600" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
