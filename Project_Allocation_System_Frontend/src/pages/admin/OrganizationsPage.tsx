import { useEffect, useState, useCallback } from "react";
import { Building2, MapPin, Users, FolderKanban, Plus, MoreVertical, Trash2, CheckCircle2, XCircle, Search, Filter, RefreshCw, X, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { createOrganization, getOrganizations, deleteOrganization } from "../../api/admin";
import type { OrganizationDto } from "../../types/adminTypes";
import type { PagedResponse } from "../../types/userTypes";
import { useToast } from "../../contexts/useToast";
import LoadingPage from "../../components/common/LoadingPage";

// Delete Confirmation Modal Component
function DeleteConfirmationModal({
  isOpen,
  orgName,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  orgName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isDeleting ? onCancel : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">
                Delete Organization
              </h3>
              <p className="text-sm text-neutral-500">
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-4">
          <p className="text-sm text-neutral-700">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-neutral-900">"{orgName}"</span>?
            This will affect all associated users and projects.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isDeleting ? (
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

function OrganizationCard({
  org,
  onDelete,
  deletingId,
}: {
  org: OrganizationDto;
  onDelete: (id: string, name: string) => void;
  deletingId: string | null;
}) {
  const [openMenu, setOpenMenu] = useState(false);

  return (
    <div className="group relative rounded-xl bg-white border border-neutral-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Status indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        org.isActive ? "bg-green-500" : "bg-neutral-300"
      }`} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4 flex-1">
            <div className={`p-3 rounded-xl ${
              org.isActive ? "bg-blue-50" : "bg-neutral-100"
            }`}>
              <Building2 size={24} className={org.isActive ? "text-blue-600" : "text-neutral-500"} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-neutral-900 mb-1 truncate">
                {org.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <MapPin size={14} />
                <span className="truncate">{org.location}</span>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setOpenMenu(!openMenu)}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              disabled={deletingId === org.organizationId}
            >
              <MoreVertical size={18} className="text-neutral-600" />
            </button>
            {openMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setOpenMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-48 rounded-lg border border-neutral-200 bg-white shadow-lg z-20">
                  <button
                    onClick={() => {
                      onDelete(org.organizationId, org.name);
                      setOpenMenu(false);
                    }}
                    disabled={deletingId === org.organizationId}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                    {deletingId === org.organizationId ? "Deleting..." : "Delete Organization"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-50">
              <Users size={16} className="text-neutral-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Users</p>
              <p className="text-lg font-semibold text-neutral-900">{org.userCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-50">
              <FolderKanban size={16} className="text-neutral-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Projects</p>
              <p className="text-lg font-semibold text-neutral-900">{org.projectCount}</p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-4 flex items-center justify-end">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            org.isActive
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-neutral-100 text-neutral-600 border border-neutral-200"
          }`}>
            {org.isActive ? (
              <>
                <CheckCircle2 size={12} />
                Active
              </>
            ) : (
              <>
                <XCircle size={12} />
                Inactive
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<PagedResponse<OrganizationDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const { showError, showSuccess } = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const filters: {
        searchTerm?: string;
        isActive?: boolean;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
      } = {};

      if (searchTerm) filters.searchTerm = searchTerm;
      if (statusFilter !== null) filters.isActive = statusFilter;
      if (sortBy) filters.sortBy = sortBy;
      if (sortOrder) filters.sortOrder = sortOrder;

      const data = await getOrganizations(page, pageSize, filters);
      setOrgs(data);
    } catch (e) {
      showError((e as Error).message);
      setOrgs(null);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, statusFilter, sortBy, sortOrder, showError]);

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  const handleCreate = async () => {
    if (!name.trim() || !location.trim()) {
      showError("Please fill in all fields");
      return;
    }

    try {
      setCreating(true);
      await createOrganization({ name, location });
      setName("");
      setLocation("");
      setShowCreate(false);
      showSuccess("Organization created successfully");
      await load();
    } catch (e) {
      showError((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id: string, orgName: string) => {
    setDeleteModal({ id, name: orgName });
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;

    try {
      setDeletingId(deleteModal.id);
      await deleteOrganization(deleteModal.id);
      showSuccess("Organization deleted successfully");
      setDeleteModal(null);
      await load();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to delete organization");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <LoadingPage message="Loading organizations..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Organizations</h1>
          <p className="mt-2 text-sm text-neutral-600 max-w-2xl">
            Manage organizations that represent the top-level ownership boundary for users,
            projects, and operational data.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 transition-colors"
          >
            <RefreshCw size={16} className="text-neutral-600" />
            <span className="text-sm font-medium text-neutral-700">Refresh</span>
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters || (searchTerm || statusFilter !== null)
                ? "border-primary-300 bg-primary-50 text-primary-700"
                : "border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700"
            }`}
          >
            <Filter size={16} />
            <span className="text-sm font-medium">Filters</span>
            {(searchTerm || statusFilter !== null) && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-neutral-900 text-white text-xs">
                {[searchTerm, statusFilter].filter(Boolean).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
          >
            <Plus size={18} />
            New Organization
          </button>
        </div>
      </header>

      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  placeholder="Search by name or location..."
                  className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter === null ? "" : statusFilter ? "active" : "inactive"}
                onChange={(e) => {
                  if (e.target.value === "") setStatusFilter(null);
                  else setStatusFilter(e.target.value === "active");
                }}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
                <option value="name">Name</option>
                <option value="location">Location</option>
                <option value="createdDate">Created Date</option>
                <option value="userCount">User Count</option>
                <option value="projectCount">Project Count</option>
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
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
          {(searchTerm || statusFilter !== null) && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter(null);
                  setSortBy("name");
                  setSortOrder("asc");
                }}
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
      {orgs && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-primary-50 border border-primary-200">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-sm text-primary-700">Total Organizations: </span>
              <span className="text-sm font-semibold text-primary-900">{orgs.totalCount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-sm text-primary-700">Showing: </span>
              <span className="text-sm font-semibold text-primary-900">
                {((page - 1) * pageSize + 1).toLocaleString()} -{" "}
                {Math.min(page * pageSize, orgs.totalCount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Create Panel */}
      {showCreate && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Create New Organization
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Organization Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter organization name"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Location
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim() || !location.trim()}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? "Creating..." : "Create Organization"}
            </button>

            <button
              onClick={() => {
                setShowCreate(false);
                setName("");
                setLocation("");
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Organizations Grid */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-sm text-neutral-600">Loading organizations...</p>
        </div>
      ) : !orgs || orgs.items.length === 0 ? (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-12 text-center">
          <Building2 size={48} className="mx-auto text-neutral-300 mb-4" />
          <p className="text-sm font-medium text-neutral-900 mb-1">
            {(searchTerm || statusFilter !== null) ? "No organizations match your filters" : "No organizations found"}
          </p>
          <p className="text-sm text-neutral-500 mb-4">
            {(searchTerm || statusFilter !== null) ? "Try adjusting your search or filters" : "Get started by creating your first organization"}
          </p>
          {!(searchTerm || statusFilter !== null) && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
            >
              <Plus size={16} />
              Create Organization
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orgs.items.map((org: OrganizationDto) => (
              <OrganizationCard
                key={org.organizationId}
                org={org}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
            ))}
          </div>

          {/* Pagination */}
          {orgs.totalCount > pageSize && (
            <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-white border border-neutral-200">
              <div className="text-sm text-neutral-600">
                Page {page} of {Math.ceil(orgs.totalCount / pageSize)}
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
                  {Array.from({ length: Math.min(5, Math.ceil(orgs.totalCount / pageSize)) }, (_, i) => {
                    const totalPages = Math.ceil(orgs.totalCount / pageSize);
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
                  disabled={page >= Math.ceil(orgs.totalCount / pageSize)}
                  className="p-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} className="text-neutral-600" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal !== null}
        orgName={deleteModal?.name ?? ""}
        isDeleting={deletingId !== null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal(null)}
      />
    </div>
  );
}
