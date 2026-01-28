import { useEffect, useState } from "react";
import { fetchAdminUsers } from "../../api/admin";
import type { UserDto, PagedResponse } from "../../types/userTypes";

/* ============================================================
   Types
   ============================================================ */

interface Props {
  onClose: () => void;
  onSelect: (pm: { userId: string; displayName: string }) => void;
}

/* ============================================================
   Component
   ============================================================ */

export default function ProjectManagerSelectModal({
  onClose,
  onSelect,
}: Props) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<PagedResponse<UserDto> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 8;

  /* ---------------- Load PMs ---------------- */
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetchAdminUsers(page, pageSize);

        if (!mounted) return;

        // filter only Project Managers (role = 2)
        const filtered: PagedResponse<UserDto> = {
          ...res,
          items: res.items.filter(
            (u) =>
              u.role === 2 &&
              (query === "" ||
                u.displayName
                  .toLowerCase()
                  .includes(query.toLowerCase()) ||
                u.email.toLowerCase().includes(query.toLowerCase()))
          ),
        };

        setData(filtered);
      } catch (e) {
        if (mounted) setError((e as Error).message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [page, query]);

  /* ---------------- Derived ---------------- */
  const totalPages = data
    ? Math.ceil(data.totalCount / data.pageSize)
    : 1;

  /* ============================================================
     UI
     ============================================================ */

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Change Project Manager
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Search and assign a Project Manager
          </p>
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email…"
            className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto px-6">
          {loading && (
            <div className="space-y-3 py-6">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && data?.items.length === 0 && (
            <div className="py-10 text-center text-sm text-neutral-500">
              No Project Managers found
            </div>
          )}

          {!loading &&
            data?.items.map((user: UserDto) => (
              <div
                key={user.userId}
                className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 mb-3 hover:bg-neutral-50"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-neutral-900">
                    {user.displayName}
                  </div>
                  <div className="truncate text-xs text-neutral-500">
                    {user.email}
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelect({
                      userId: user.userId,
                      displayName: user.displayName,
                    });
                    onClose();
                  }}
                  className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
                >
                  Assign
                </button>
              </div>
            ))}
        </div>

        {/* Pagination */}
        {data && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-3">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50"
            >
              Previous
            </button>

            <span className="text-xs text-neutral-600">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end border-t border-neutral-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="h-14 rounded-xl bg-neutral-200 animate-pulse" />
  );
}
