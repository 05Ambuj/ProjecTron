import { useEffect, useState, useCallback } from "react";
import {
  Shield,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building2,
  FolderKanban,
  Users,
  CheckSquare,
  X,
} from "lucide-react";
import { fetchAuditLogs } from "../../api/admin";
import type { AuditLogDto, AuditLogFilter } from "../../types/adminTypes";
import type { PagedResponse } from "../../types/userTypes";
import { useToast } from "../../contexts/useToast";

function AuditLogRow({ log }: { log: AuditLogDto }) {
  const getActionColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("create") || act.includes("add")) return "bg-green-50 text-green-700 border-green-200";
    if (act.includes("update") || act.includes("change")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (act.includes("delete") || act.includes("remove")) return "bg-red-50 text-red-700 border-red-200";
    return "bg-neutral-50 text-neutral-700 border-neutral-200";
  };

  const renderEntityIcon = (entityType: string) => {
    const type = entityType.toLowerCase();
    const iconProps = { size: 16, className: "text-neutral-600" };
    
    if (type.includes("project")) return <FolderKanban {...iconProps} />;
    if (type.includes("user")) return <Users {...iconProps} />;
    if (type.includes("organization")) return <Building2 {...iconProps} />;
    if (type.includes("task")) return <CheckSquare {...iconProps} />;
    return <Activity {...iconProps} />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <tr className="border-b border-neutral-100 hover:bg-linear-to-r hover:from-primary-50/50 hover:to-transparent transition-all duration-200 group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-linear-to-br from-neutral-50 to-neutral-100 group-hover:from-primary-50 group-hover:to-primary-100 transition-all duration-200 shadow-sm">
            {renderEntityIcon(log.entityType)}
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">{log.entityType}</p>
            <p className="text-xs text-neutral-500 font-mono" title={log.entityId}>
              {log.entityId.slice(0, 8)}...
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border-2 shadow-sm ${getActionColor(log.action)}`}>
          {log.action}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-full bg-neutral-100 group-hover:bg-primary-100 transition-colors">
            <User size={12} className="text-neutral-600" />
          </div>
          <span className="text-sm font-medium text-neutral-700">{log.userEmail}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="max-w-2xl wrap-break-word">
          <p
            className="text-sm font-medium text-neutral-900 leading-relaxed"
            title={log.description || `${log.action} on ${log.entityType}`}
          >
            {log.description || `${log.action} on ${log.entityType}`}
          </p>
          {log.fieldName && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                {log.fieldName}
              </span>
              {log.oldValue && log.newValue && (
                <span className="text-xs text-neutral-500 flex items-center gap-1">
                  <span className="line-through text-red-400">{log.oldValue}</span>
                  <span className="text-neutral-400">→</span>
                  <span className="text-green-600 font-medium">{log.newValue}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Calendar size={14} />
          <span>{formatDate(log.createdDate)}</span>
        </div>
      </td>
    </tr>
  );
}

export default function AuditLogsPage() {
  const { showError } = useToast();
  const [logs, setLogs] = useState<PagedResponse<AuditLogDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AuditLogFilter>({
    pageNumber: 1,
    pageSize: 20,
  });
  const [showFilters, setShowFilters] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAuditLogs(filters);
      setLogs(data);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to load audit logs");
      setLogs(null);
    } finally {
      setLoading(false);
    }
  }, [filters, showError]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleFilterChange = (key: keyof AuditLogFilter, value: string | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
      pageNumber: 1, // Reset to first page on filter change
    }));
  };

  const clearFilters = () => {
    setFilters({
      pageNumber: 1,
      pageSize: 20,
    });
  };

  const hasActiveFilters = Boolean(
    filters.entityType || filters.action || filters.userEmail || filters.searchTerm || filters.startDate || filters.endDate
  );

  const totalPages = logs ? Math.ceil(logs.totalCount / (filters.pageSize || 20)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Audit Logs</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Review system activity and administrative actions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadLogs}
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
                {Object.values(filters).filter((v) => v !== undefined && v !== 1 && v !== 20).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Entity Type
              </label>
              <input
                type="text"
                value={filters.entityType || ""}
                onChange={(e) => handleFilterChange("entityType", e.target.value)}
                placeholder="e.g., Project, User, Task"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Action
              </label>
              <input
                type="text"
                value={filters.action || ""}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                placeholder="e.g., Created, Updated, Deleted"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                User Email
              </label>
              <input
                type="text"
                value={filters.userEmail || ""}
                onChange={(e) => handleFilterChange("userEmail", e.target.value)}
                placeholder="Filter by user email"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={filters.searchTerm || ""}
                  onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
                  placeholder="Search in descriptions..."
                  className="w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
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
      {logs && (
        <div className="flex items-center justify-between px-6 py-4 rounded-xl bg-linear-to-r from-primary-50 to-primary-100 border border-primary-200 shadow-sm">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-primary-600" />
              <span className="text-sm font-medium text-primary-700">Total Records: </span>
              <span className="text-sm font-bold text-primary-900">{logs.totalCount.toLocaleString()}</span>
            </div>
            <div className="h-6 w-px bg-primary-300"></div>
            <div>
              <span className="text-sm font-medium text-primary-700">Showing: </span>
              <span className="text-sm font-bold text-primary-900">
                {((logs.page - 1) * logs.pageSize + 1).toLocaleString()} -{" "}
                {Math.min(logs.page * logs.pageSize, logs.totalCount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl bg-white border border-neutral-200 shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-600"></div>
            <p className="mt-4 text-sm font-medium text-neutral-600">Loading audit logs...</p>
          </div>
        ) : !logs || logs.items.length === 0 ? (
          <div className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
              <Shield size={32} className="text-neutral-400" />
            </div>
            <p className="text-base font-semibold text-neutral-900 mb-1">No audit logs found</p>
            <p className="text-sm text-neutral-500">
              {hasActiveFilters ? "Try adjusting your filters" : "No activity recorded yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-linear-to-r from-neutral-50 to-neutral-100 border-b-2 border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Date & Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-100">
                  {logs.items.map((log) => (
                    <AuditLogRow key={log.auditLogId} log={log} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t-2 border-neutral-200 bg-linear-to-r from-neutral-50 to-transparent flex items-center justify-between">
                <div className="text-sm font-medium text-neutral-700">
                  Page <span className="font-bold text-primary-600">{logs.page}</span> of <span className="font-bold">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFilterChange("pageNumber", (filters.pageNumber || 1) - 1)}
                    disabled={logs.page <= 1}
                    className="p-2 rounded-lg border-2 border-neutral-300 bg-white hover:bg-primary-50 hover:border-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
                  >
                    <ChevronLeft size={16} className="text-neutral-700" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (logs.page <= 3) {
                        pageNum = i + 1;
                      } else if (logs.page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = logs.page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handleFilterChange("pageNumber", pageNum)}
                          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm ${
                            logs.page === pageNum
                              ? "bg-neutral-900 text-white shadow-md scale-105"
                              : "bg-white text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 border-2 border-neutral-300 hover:border-neutral-400"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handleFilterChange("pageNumber", (filters.pageNumber || 1) + 1)}
                    disabled={logs.page >= totalPages}
                    className="p-2 rounded-lg border-2 border-neutral-300 bg-white hover:bg-primary-50 hover:border-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow"
                  >
                    <ChevronRight size={16} className="text-neutral-700" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
