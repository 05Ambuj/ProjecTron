import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { fetchPMProjects } from "../../features/pm/pmSlice";
import { createSprint, fetchSprintById, updateSprint } from "../../api/sprint";
import { Zap, Calendar, Target } from "lucide-react";
import { useToast } from "../../contexts/useToast";
import { UserRole } from "../../constants/roles";

export default function PMSprintPlanningPage() {
  const navigate = useNavigate();
  const { sprintId } = useParams<{ sprintId?: string }>();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { projects } = useSelector((state: RootState) => state.pm);
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const { showError, showSuccess } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    projectId: "",
    name: "",
    goals: "",
    startDate: "",
    endDate: "",
    totalStoryPoints: 50,
    notes: "",
  });

  useEffect(() => {
    if (!user || !token || user.role !== UserRole.ProjectManager) return;
    dispatch(fetchPMProjects({ page: 1, pageSize: 100, actorRole: user.role as UserRole }));
  }, [dispatch, user, token]);

  // Preselect project if coming from Project Details
  useEffect(() => {
    const projectIdFromQuery = searchParams.get("projectId");
    if (projectIdFromQuery) {
      setForm((prev) => ({ ...prev, projectId: projectIdFromQuery }));
    }
  }, [searchParams]);

  // Load existing sprint for edit mode
  useEffect(() => {
    let cancelled = false;
    async function loadSprint() {
      if (!sprintId) return;
      try {
        const sprint = await fetchSprintById(sprintId);
        if (cancelled) return;
        setForm({
          projectId: sprint.projectId,
          name: sprint.name,
          goals: sprint.goals,
          startDate: sprint.startDate.slice(0, 10),
          endDate: sprint.endDate.slice(0, 10),
          totalStoryPoints: sprint.totalStoryPoints,
          notes: sprint.notes ?? "",
        });
      } catch (err) {
        if (!cancelled) {
          showError(err instanceof Error ? err.message : "Failed to load sprint");
        }
      }
    }
    loadSprint();
    return () => {
      cancelled = true;
    };
  }, [sprintId, showError]);

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!form.projectId) errors.projectId = "Project is required";
    if (!form.name) errors.name = "Sprint name is required";
    if (!form.goals) errors.goals = "Sprint goals are required";
    if (!form.startDate) errors.startDate = "Start date is required";
    if (!form.endDate) errors.endDate = "End date is required";

    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);

      if (end <= start) {
        errors.endDate = "End date must be after start date";
      }

      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (duration > 30) {
        errors.endDate = "Sprint duration should not exceed 30 days";
      }
    }

    if (form.totalStoryPoints < 1 || form.totalStoryPoints > 1000) {
      errors.totalStoryPoints = "Story points must be between 1 and 1000";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      if (sprintId) {
        await updateSprint(
          sprintId,
          {
            name: form.name,
            goals: form.goals,
            startDate: form.startDate,
            endDate: form.endDate,
            totalStoryPoints: form.totalStoryPoints,
            notes: form.notes || undefined,
          },
          (user?.role as UserRole) || UserRole.ProjectManager,
        );
        showSuccess("Sprint updated successfully");
        navigate(`/pm/sprints/${sprintId}/stats`);
      } else {
        await createSprint(
          {
            ...form,
            members: [], // Can be added later
          },
          (user?.role as UserRole) || UserRole.ProjectManager,
        );
        showSuccess("Sprint created successfully");
        navigate("/pm/sprints/active");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to create sprint");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-white border border-neutral-300 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-neutral-900 text-white rounded-lg">
              <Zap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">
                {sprintId ? "Edit Sprint" : "Sprint Planning"}
              </h1>
              <p className="text-sm text-neutral-600">
                {sprintId ? "Update sprint details" : "Create a new sprint for your project"}
              </p>
            </div>
          </div>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-neutral-300 rounded-lg p-8">
          {/* Project Selection */}
          <section className="mb-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-4">
              Project
            </h3>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Select Project <span className="text-red-600">*</span>
              </label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                disabled={!!sprintId}
                className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 ${
                  fieldErrors.projectId ? "border-amber-500 bg-amber-50" : "border-neutral-300"
                }`}
              >
                <option value="">Choose a project...</option>
                {projects.map((project) => (
                  <option key={project.projectId} value={project.projectId}>
                    {project.name}
                  </option>
                ))}
              </select>
              {fieldErrors.projectId && (
                <p className="mt-1 text-xs text-amber-700">{fieldErrors.projectId}</p>
              )}
            </div>
          </section>

          {/* Sprint Details */}
          <section className="mb-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-4 flex items-center gap-2">
              <Target size={14} />
              Sprint Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Sprint Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Sprint 1 - Authentication Module"
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 ${
                    fieldErrors.name ? "border-amber-500 bg-amber-50" : "border-neutral-300"
                  }`}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-amber-700">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Sprint Goals <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={form.goals}
                  onChange={(e) => setForm({ ...form, goals: e.target.value })}
                  placeholder="What should the team accomplish in this sprint?"
                  rows={4}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 ${
                    fieldErrors.goals ? "border-amber-500 bg-amber-50" : "border-neutral-300"
                  }`}
                />
                {fieldErrors.goals && (
                  <p className="mt-1 text-xs text-amber-700">{fieldErrors.goals}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Total Story Points
                </label>
                <input
                  type="number"
                  value={form.totalStoryPoints}
                  onChange={(e) =>
                    setForm({ ...form, totalStoryPoints: parseInt(e.target.value) || 0 })
                  }
                  min="1"
                  max="1000"
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 ${
                    fieldErrors.totalStoryPoints
                      ? "border-amber-500 bg-amber-50"
                      : "border-neutral-300"
                  }`}
                />
                {fieldErrors.totalStoryPoints && (
                  <p className="mt-1 text-xs text-amber-700">{fieldErrors.totalStoryPoints}</p>
                )}
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="mb-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-4 flex items-center gap-2">
              <Calendar size={14} />
              Timeline
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Start Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 ${
                    fieldErrors.startDate ? "border-amber-500 bg-amber-50" : "border-neutral-300"
                  }`}
                />
                {fieldErrors.startDate && (
                  <p className="mt-1 text-xs text-amber-700">{fieldErrors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  End Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 ${
                    fieldErrors.endDate ? "border-amber-500 bg-amber-50" : "border-neutral-300"
                  }`}
                />
                {fieldErrors.endDate && (
                  <p className="mt-1 text-xs text-amber-700">{fieldErrors.endDate}</p>
                )}
              </div>
            </div>

            {form.startDate && form.endDate && (
              <div className="mt-3 p-3 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-600">
                Sprint duration:{" "}
                {Math.ceil(
                  (new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                days
              </div>
            )}
          </section>

          {/* Notes */}
          <section className="mb-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-4">
              Additional Notes
            </h3>

            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any additional information or context..."
              rows={3}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </section>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={() => navigate("/pm/sprints/active")}
              className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-60"
            >
              {isSubmitting ? "Creating Sprint..." : "Create Sprint"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}