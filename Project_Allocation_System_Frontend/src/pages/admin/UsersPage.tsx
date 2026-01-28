import { useEffect, useState, useCallback, useRef } from "react";
import { MoreVertical, Trash2, Search, Filter, Users as UsersIcon, Building2, Briefcase, UserCheck, UserX, RefreshCw, X, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { fetchAdminUsers, deleteUser } from "../../api/admin";
import type { UserDto } from "../../types/userTypes";
import type { PagedResponse } from "../../types/userTypes";
import LoadingPage from "../../components/common/LoadingPage";
import { useToast } from "../../contexts/useToast";

// Delete Confirmation Modal Component
function DeleteConfirmationModal({
  isOpen,
  userName,
  isDeleting,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  userName: string;
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
                Delete User
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
            <span className="font-semibold text-neutral-900">"{userName}"</span>?
            This will permanently remove the user and all associated data.
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

function UserRow({ user, onDelete, deletingId, openMenuId, setOpenMenuId }: {
  user: UserDto;
  onDelete: (id: string, name: string) => void;
  deletingId: string | null;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
}) {
  const getRoleBadge = (role: number) => {
    const roleMap: Record<number, { label: string; color: string }> = {
      1: { label: "Admin", color: "bg-purple-50 text-purple-700 border-purple-200" },
      2: { label: "Project Manager", color: "bg-blue-50 text-blue-700 border-blue-200" },
      3: { label: "Team Lead", color: "bg-green-50 text-green-700 border-green-200" },
      4: { label: "Team Member", color: "bg-neutral-50 text-neutral-700 border-neutral-200" },
    };
    const roleInfo = roleMap[role] || { label: "Unknown", color: "bg-neutral-50 text-neutral-700 border-neutral-200" };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${roleInfo.color}`}>
        {roleInfo.label}
      </span>
    );
  };

  return (
    <tr className="border-b border-neutral-200 hover:bg-neutral-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${user.isActive ? "bg-primary-50" : "bg-neutral-100"}`}>
            <UsersIcon size={18} className={user.isActive ? "text-primary-600" : "text-neutral-400"} />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">{user.displayName}</p>
            <p className="text-xs text-neutral-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {getRoleBadge(user.role)}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-neutral-700">
          <Briefcase size={14} className="text-neutral-400" />
          <span>{user.department || "—"}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-neutral-700">
          <Building2 size={14} className="text-neutral-400" />
          <span>{user.organizationName || "—"}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          user.isActive
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-neutral-100 text-neutral-600 border border-neutral-200"
        }`}>
          {user.isActive ? (
            <>
              <UserCheck size={12} />
              Active
            </>
          ) : (
            <>
              <UserX size={12} />
              Inactive
            </>
          )}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="relative">
          <button
            onClick={() => setOpenMenuId(openMenuId === user.userId ? null : user.userId)}
            className="p-2 rounded-lg hover:bg-neutral-200 transition-colors"
            disabled={deletingId === user.userId}
          >
            <MoreVertical size={16} className="text-neutral-600" />
          </button>
          {openMenuId === user.userId && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setOpenMenuId(null)}
              />
              <div className="absolute right-0 mt-1 w-48 rounded-lg border border-neutral-200 bg-white shadow-lg z-20">
                <button
                  onClick={() => {
                    onDelete(user.userId, user.displayName);
                    setOpenMenuId(null);
                  }}
                  disabled={deletingId === user.userId}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {deletingId === user.userId ? "Deleting..." : "Delete User"}
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<PagedResponse<UserDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<string>("createdDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: string; name: string } | null>(null);
  const { showError, showSuccess } = useToast();
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const filters: {
        searchTerm?: string;
        role?: number;
        isActive?: boolean;
        sortBy?: string;
        sortOrder?: "asc" | "desc";
      } = {};

      if (searchTerm) filters.searchTerm = searchTerm;
      if (roleFilter !== null) filters.role = roleFilter;
      if (statusFilter !== null) filters.isActive = statusFilter;
      if (sortBy) filters.sortBy = sortBy;
      if (sortOrder) filters.sortOrder = sortOrder;

      const res = await fetchAdminUsers(page, pageSize, filters);
      setUsers(res);
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : "Failed to load users");
      setUsers(null);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, roleFilter, statusFilter, sortBy, sortOrder, showError]);

  // Debounce search input
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      loadUsers();
    }, 500); // 500ms debounce

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchTerm, loadUsers]);

  // Load users when filters (except search) or page changes
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    loadUsers();
  }, [page, roleFilter, statusFilter, sortBy, sortOrder, loadUsers]);

  // Reset to page 1 when filters change (except page itself)
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, roleFilter, statusFilter, sortBy, sortOrder]);

  const handleDelete = (userId: string, userName: string) => {
    setDeleteModal({ id: userId, name: userName });
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;

    try {
      setDeletingId(deleteModal.id);
      await deleteUser(deleteModal.id);
      showSuccess("User deleted successfully");
      setDeleteModal(null);
      setOpenMenuId(null);
      loadUsers();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  const hasActiveFilters = searchTerm !== "" || roleFilter !== null || statusFilter !== null;
  const totalPages = users ? Math.ceil(users.totalCount / pageSize) : 0;

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter(null);
    setStatusFilter(null);
    setSortBy("createdDate");
    setSortOrder("desc");
  };

  if (loading) {
    return <LoadingPage message="Loading users..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Users & Roles</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Manage users, roles, and access across the system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadUsers}
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
                {[searchTerm, roleFilter, statusFilter].filter(Boolean).length}
              </span>
            )}
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
                  placeholder="Search by name, email, or department..."
                  className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Role
              </label>
              <select
                value={roleFilter ?? ""}
                onChange={(e) => setRoleFilter(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Roles</option>
                <option value="1">Admin</option>
                <option value="2">Project Manager</option>
                <option value="3">Team Lead</option>
                <option value="4">Team Member</option>
              </select>
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
      {users && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-primary-50 border border-primary-200">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-sm text-primary-700">Total Users: </span>
              <span className="text-sm font-semibold text-primary-900">{users.totalCount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-sm text-primary-700">Showing: </span>
              <span className="text-sm font-semibold text-primary-900">
                {((page - 1) * pageSize + 1).toLocaleString()} -{" "}
                {Math.min(page * pageSize, users.totalCount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-sm text-neutral-600">Loading users...</p>
          </div>
        ) : !users || users.items.length === 0 ? (
          <div className="p-12 text-center">
            <UsersIcon size={48} className="mx-auto text-neutral-300 mb-4" />
            <p className="text-sm font-medium text-neutral-900 mb-1">
              {hasActiveFilters ? "No users match your filters" : "No users found"}
            </p>
            <p className="text-sm text-neutral-500">
              {hasActiveFilters ? "Try adjusting your search or filters" : "Users will appear here once added"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider w-12">
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {users.items.map((user) => (
                    <UserRow
                      key={user.userId}
                      user={user}
                      onDelete={handleDelete}
                      deletingId={deletingId}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between">
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal !== null}
        userName={deleteModal?.name ?? ""}
        isDeleting={deletingId !== null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal(null)}
      />
    </div>
  );
}
