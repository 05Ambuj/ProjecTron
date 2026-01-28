import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Search, UserCircle2, Calendar } from "lucide-react";
import { createTLTask, fetchTLProjects, fetchTLAssignableUsers, fetchTLSprintsByProject } from "../../api/tl";
import { useToast } from "../../contexts/useToast";
import LoadingPage from "../../components/common/LoadingPage";
import type { ProjectDto } from "../../types/adminTypes";
import { useSelector } from "react-redux";
import type { RootState } from "../../app/store";
import type { UserDto } from "../../types/userTypes";
import type { SprintDTO } from "../../types/sprintTypes";

export default function TLCreateTaskPage() {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [sprints, setSprints] = useState<SprintDTO[]>([]);
  const [isLoadingSprints, setIsLoadingSprints] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [assignableUsers, setAssignableUsers] = useState<UserDto[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({
    projectId: "",
    sprintId: "",
    title: "",
    description: "",
    taskType: 1,
    priority: 2,
    complexity: 2,
    riskLevel: 1,
    storyPoints: 5,
    estimatedHours: 0.5,
    acceptanceCriteria: "",
    effortCategory: "",
    assignedToUserId: "",
    dueDate: "",
  });
  const [assignToSelf, setAssignToSelf] = useState(false);

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await fetchTLProjects();
        setProjects(data);
      } catch {
        showError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [showError]);

  // Load sprints when project is selected
  useEffect(() => {
    async function loadSprints() {
      if (!form.projectId) {
        setSprints([]);
        setForm((prev) => ({ ...prev, sprintId: "" }));
        return;
      }

      try {
        setIsLoadingSprints(true);
        const data = await fetchTLSprintsByProject(form.projectId);
        // Filter to show active and planned sprints (status 0 or 1)
        const availableSprints = data.filter(
          (s) => s.status === 0 || s.status === 1
        );
        setSprints(availableSprints);

        // Show warning if no sprints available
        if (availableSprints.length === 0 && !isLoadingSprints) {
          showError("No sprints available for this project. Please create a sprint first before creating tasks.");
        }

        // Auto-select active sprint if available (only if sprintId is not already set)
        if (!form.sprintId) {
          const activeSprint = availableSprints.find((s) => s.status === 1);
          if (activeSprint) {
            setForm((prev) => ({ ...prev, sprintId: activeSprint.sprintId }));
          } else if (availableSprints.length === 1) {
            setForm((prev) => ({ ...prev, sprintId: availableSprints[0].sprintId }));
          }
        }
      } catch {
        showError("Failed to load sprints");
        setSprints([]);
      } finally {
        setIsLoadingSprints(false);
      }
    }
    loadSprints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.projectId, showError]);

  // Load assignable users for TL (project team members + team lead themselves)
  // This loads immediately when project is selected (without search)
  useEffect(() => {
    async function loadUsers() {
      // Only Team Leads are allowed to load assignable users
      if (!user || user.role !== 3 || !form.projectId) {
        setAssignableUsers([]);
        return;
      }

      // Don't search on initial load - just load all team members
      if (userSearch.trim()) {
        return; // Let the debounced search handle it
      }

      try {
        setIsLoadingUsers(true);
        const data = await fetchTLAssignableUsers({
          page: 1,
          pageSize: 50,
          projectId: form.projectId,
        });
        
        // Ensure the team lead themselves is in the list
        const teamLeadInList = data.items.some((u) => u.userId === user.userId);
        let finalUsers = data.items;
        
        if (!teamLeadInList && user.userId) {
          // Add team lead to the list
          finalUsers = [
            {
              userId: user.userId,
              email: user.email || "",
              displayName: user.displayName || user.email || "You",
              firstName: user.firstName || "",
              lastName: user.lastName || "",
              department: user.department || "",
              role: user.role,
              isActive: true,
              createdDate: "",
            },
            ...data.items,
          ];
        }
        
        setAssignableUsers(finalUsers);
      } catch (err) {
        // Show error message to user
        const errorMessage = err instanceof Error ? err.message : "Failed to load team members";
        console.error("Failed to load assignable users:", err);
        
        // For 403 errors, show helpful message but don't block task creation
        // Team Lead can still create tasks and assign to themselves
        if (errorMessage.includes("403") || errorMessage.includes("access") || errorMessage.includes("Forbidden")) {
          // Silently fail - user can still assign to themselves
          // The "Assign to me" option will still work
          setAssignableUsers([]);
        } else {
          setAssignableUsers([]);
        }
      } finally {
        setIsLoadingUsers(false);
      }
    }
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, form.projectId]);

  // Debounced search for users
  useEffect(() => {
    // Clear previous timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Don't search if no project selected or if search is empty
    if (!form.projectId || !userSearch.trim()) {
      // If search is cleared, reload all users
      if (!userSearch.trim() && form.projectId && user) {
        const currentUser = user; // Capture user for closure
        searchDebounceRef.current = setTimeout(async () => {
          if (!currentUser) return;
          try {
            setIsLoadingUsers(true);
            const data = await fetchTLAssignableUsers({
              page: 1,
              pageSize: 50,
              projectId: form.projectId,
            });
            
            // Ensure the team lead themselves is in the list
            const teamLeadInList = data.items.some((u) => u.userId === currentUser.userId);
            let finalUsers = data.items;
            
            if (!teamLeadInList && currentUser.userId) {
              finalUsers = [
                {
                  userId: currentUser.userId,
                  email: currentUser.email || "",
                  displayName: currentUser.displayName || currentUser.email || "You",
                  firstName: currentUser.firstName || "",
                  lastName: currentUser.lastName || "",
                  department: currentUser.department || "",
                  role: currentUser.role,
                  isActive: true,
                  createdDate: "",
                },
                ...data.items,
              ];
            }
            
            setAssignableUsers(finalUsers);
          } catch (err) {
            console.error("Failed to load assignable users:", err);
          } finally {
            setIsLoadingUsers(false);
          }
        }, 300);
      }
      return;
    }

    // Debounce search - wait 500ms after user stops typing
    if (!user || user.role !== 3 || !form.projectId) {
      return;
    }

    const currentUser = user; // Capture user for closure
    const currentProjectId = form.projectId;
    const currentSearchTerm = userSearch.trim();

    searchDebounceRef.current = setTimeout(async () => {
      if (!currentUser || currentUser.role !== 3 || !currentProjectId) {
        return;
      }

      try {
        setIsLoadingUsers(true);
        const data = await fetchTLAssignableUsers({
          searchTerm: currentSearchTerm,
          page: 1,
          pageSize: 50,
          projectId: currentProjectId,
        });
        
        // Ensure the team lead themselves is in the list if they match search
        const teamLeadInList = data.items.some((u) => u.userId === currentUser.userId);
        let finalUsers = data.items;
        
        // Only add team lead if they match the search term
        const searchLower = currentSearchTerm.toLowerCase();
        const teamLeadMatches = 
          !teamLeadInList && 
          currentUser.userId &&
          (currentUser.email?.toLowerCase().includes(searchLower) ||
           currentUser.displayName?.toLowerCase().includes(searchLower) ||
           `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.toLowerCase().includes(searchLower));
        
        if (teamLeadMatches) {
          finalUsers = [
            {
              userId: currentUser.userId,
              email: currentUser.email || "",
              displayName: currentUser.displayName || currentUser.email || "You",
              firstName: currentUser.firstName || "",
              lastName: currentUser.lastName || "",
              department: currentUser.department || "",
              role: currentUser.role,
              isActive: true,
              createdDate: "",
            },
            ...data.items,
          ];
        }
        
        setAssignableUsers(finalUsers);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to search users";
        if (!errorMessage.includes("403") && !errorMessage.includes("access")) {
          console.error("Failed to search users:", err);
        }
        setAssignableUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    }, 500); // 500ms debounce

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [userSearch, form.projectId, user]);

  // Handle assign to self toggle
  useEffect(() => {
    if (assignToSelf && user?.userId) {
      setForm((prev) => ({ ...prev, assignedToUserId: user.userId }));
    } else if (!assignToSelf) {
      setForm((prev) => ({ ...prev, assignedToUserId: "" }));
    }
  }, [assignToSelf, user]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.projectId) newErrors.projectId = "Project is required";
    if (!form.sprintId) newErrors.sprintId = "Sprint is required";
    if (form.projectId && sprints.length === 0 && !isLoadingSprints) {
      newErrors.projectId = "No sprints available for this project. Please create a sprint first.";
    }
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!form.description.trim()) newErrors.description = "Description is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);
      await createTLTask({
        projectId: form.projectId,
        sprintId: form.sprintId,
        title: form.title,
        description: form.description,
        taskType: form.taskType,
        priority: form.priority,
        complexity: form.complexity,
        riskLevel: form.riskLevel,
        storyPoints: form.storyPoints,
        estimatedHours: form.estimatedHours,
        acceptanceCriteria: form.acceptanceCriteria?.trim() || undefined,
        effortCategory: form.effortCategory?.trim() || undefined,
        assignedToUserId: form.assignedToUserId || undefined,
        dueDate: form.dueDate || undefined,
      });
      showSuccess("Task created successfully");
      navigate("/tl/tasks/all");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingPage message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        <header className="flex items-center justify-between">
          <Link
            to="/tl/tasks/all"
            className="inline-flex items-center gap-2 px-3 py-2 -ml-3 rounded-lg text-sm font-medium text-neutral-600 hover:text-primary-600 hover:bg-neutral-100 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back to Tasks</span>
          </Link>
        </header>

        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-200 bg-neutral-50">
            <h1 className="text-2xl font-bold text-neutral-900">Create New Task</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Create a new work item for your sprint. All fields marked with <span className="text-red-500">*</span> are required.
            </p>
          </div>

          <div className="p-6">

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project & Sprint Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value, sprintId: "" })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.projectId ? "border-red-300" : "border-neutral-300"
                  }`}
                >
                  <option value="">Select a project...</option>
                  {projects.map((project) => (
                    <option key={project.projectId} value={project.projectId}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {errors.projectId && (
                  <p className="mt-1 text-xs text-red-600">{errors.projectId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Sprint <span className="text-red-500">*</span>
                </label>
                {form.projectId && !isLoadingSprints && sprints.length === 0 && (
                  <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-amber-100 rounded">
                        <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-800">No Sprints Available</p>
                        <p className="text-xs text-amber-700">You need to create a sprint for this project before you can create tasks.</p>
                      </div>
                    </div>
                  </div>
                )}
                <select
                  value={form.sprintId}
                  onChange={(e) => setForm({ ...form, sprintId: e.target.value })}
                  disabled={!form.projectId || isLoadingSprints || sprints.length === 0}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.sprintId ? "border-red-300" : "border-neutral-300"
                  } ${!form.projectId || isLoadingSprints || sprints.length === 0 ? "bg-neutral-100 cursor-not-allowed" : ""}`}
                >
                  <option value="">
                    {isLoadingSprints
                      ? "Loading sprints..."
                      : !form.projectId
                      ? "Select a project first"
                      : sprints.length === 0
                      ? "No available sprints"
                      : "Select a sprint..."}
                  </option>
                  {sprints.map((sprint) => (
                    <option key={sprint.sprintId} value={sprint.sprintId}>
                      {sprint.name} {sprint.status === 1 ? "(Active)" : sprint.status === 0 ? "(Planned)" : ""}
                    </option>
                  ))}
                </select>
                {errors.sprintId && (
                  <p className="mt-1 text-xs text-red-600">{errors.sprintId}</p>
                )}
                {form.sprintId && sprints.length > 0 && (
                  <div className="mt-2 text-xs text-neutral-500 flex items-center gap-1">
                    <Calendar size={12} />
                    {(() => {
                      const selectedSprint = sprints.find((s) => s.sprintId === form.sprintId);
                      if (selectedSprint) {
                        const start = new Date(selectedSprint.startDate).toLocaleDateString();
                        const end = new Date(selectedSprint.endDate).toLocaleDateString();
                        return `${start} - ${end}`;
                      }
                      return "";
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.title ? "border-red-300" : "border-neutral-300"
                }`}
                placeholder="Enter task title"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-600">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.description ? "border-red-300" : "border-neutral-300"
                }`}
                placeholder="Describe the task..."
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Priority & Story Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                >
                  <option value={1}>Low</option>
                  <option value={2}>Medium</option>
                  <option value={3}>High</option>
                  <option value={4}>Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Story Points
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.storyPoints}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      storyPoints: Math.max(1, Math.min(100, parseInt(e.target.value) || 1)),
                    })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                />
              </div>
            </div>

            {/* Assignment Section */}
            <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Assign To
              </label>
              <div className="space-y-3">
                <label
                  htmlFor="assignToSelf"
                  className="flex items-center gap-2 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <input
                    id="assignToSelf"
                    type="radio"
                    name="assignment"
                    checked={assignToSelf}
                    onChange={() => {
                      setAssignToSelf(true);
                      setForm((prev) => ({ ...prev, assignedToUserId: user?.userId || "" }));
                    }}
                    className="h-4 w-4 text-primary-600 cursor-pointer"
                  />
                  <div className="flex-1 flex items-center gap-2">
                    <UserCircle2 size={18} className="text-primary-600" />
                    <div>
                      <div className="text-sm font-medium text-neutral-900">
                        Assign to me
                      </div>
                      <div className="text-xs text-neutral-500">
                        {user?.email || "your account"}
                      </div>
                    </div>
                  </div>
                </label>

                <label
                  htmlFor="assignToOther"
                  className="flex items-center gap-2 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <input
                    id="assignToOther"
                    type="radio"
                    name="assignment"
                    checked={!assignToSelf}
                    onChange={() => {
                      setAssignToSelf(false);
                      setForm((prev) => ({ ...prev, assignedToUserId: "" }));
                    }}
                    className="h-4 w-4 text-primary-600 cursor-pointer"
                  />
                  <div className="flex-1 text-sm font-medium text-neutral-900">
                    Assign to another team member
                  </div>
                </label>

                {!assignToSelf && (
                  <div className="border border-neutral-200 rounded-lg">
                    <div className="flex items-center border-b border-neutral-200 px-3 py-2 bg-neutral-50">
                      <Search size={14} className="text-neutral-400 mr-2" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="flex-1 text-sm border-none outline-none bg-transparent"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {isLoadingUsers && (
                        <div className="px-3 py-4 text-xs text-neutral-500 text-center">
                          Loading users...
                        </div>
                      )}
                      {!isLoadingUsers && assignableUsers.length === 0 && userSearch && (
                        <div className="px-3 py-4 text-xs text-neutral-500 text-center">
                          No matching users found.
                        </div>
                      )}
                      {!isLoadingUsers && assignableUsers.length === 0 && !userSearch && form.projectId && (
                        <div className="px-3 py-4 text-xs text-neutral-500 text-center space-y-1">
                          <div>Team members will appear here when available.</div>
                          <div className="text-neutral-400 mt-1">You can still assign the task to yourself using the option above.</div>
                        </div>
                      )}
                      {!isLoadingUsers &&
                        assignableUsers.map((u) => (
                          <button
                            key={u.userId}
                            type="button"
                            onClick={() => {
                              setForm((prev) => ({ ...prev, assignedToUserId: u.userId || "" }));
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-primary-50 transition-colors ${
                              form.assignedToUserId === u.userId
                                ? "bg-primary-50 border-l-2 border-primary-600"
                                : ""
                            }`}
                          >
                            <div className="shrink-0">
                              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-primary-700">
                                  {(u.displayName || u.firstName || u.email || "U")
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-neutral-900 truncate">
                                {u.displayName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email}
                              </div>
                              <div className="text-xs text-neutral-500 truncate">{u.email}</div>
                              {u.role === 3 && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                  Team Lead
                                </span>
                              )}
                            </div>
                            {form.assignedToUserId === u.userId && (
                              <div className="shrink-0">
                                <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-3">
                You can assign tasks to yourself or any team member in the project.
              </p>
            </div>

            {/* Advanced Details Section */}
            <div className="border-t border-neutral-200 pt-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Additional Details</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Acceptance Criteria
                </label>
                <textarea
                  rows={3}
                  value={form.acceptanceCriteria}
                  onChange={(e) =>
                    setForm({ ...form, acceptanceCriteria: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Define the conditions of satisfaction for this task..."
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Similar to Azure DevOps, use this to clarify when the work is considered done.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Effort Category
                </label>
                <select
                  value={form.effortCategory}
                  onChange={(e) =>
                    setForm({ ...form, effortCategory: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select category (optional)...</option>
                  <option value="Feature">Feature</option>
                  <option value="Bug">Bug</option>
                  <option value="Improvement">Improvement</option>
                  <option value="Spike">Spike / Investigation</option>
                  <option value="Chore">Chore / Maintenance</option>
                </select>
              </div>

              </div>
            </div>

            {/* Time & Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  max="1000"
                  value={form.estimatedHours}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      estimatedHours:
                        Math.max(0.5, Math.min(1000, parseFloat(e.target.value) || 0.5)),
                    })
                  }
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                  placeholder="0.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 mt-6 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => navigate("/tl/tasks/all")}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || (form.projectId !== "" && sprints.length === 0 && !isLoadingSprints)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-primary-600 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  "Create Task"
                )}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
