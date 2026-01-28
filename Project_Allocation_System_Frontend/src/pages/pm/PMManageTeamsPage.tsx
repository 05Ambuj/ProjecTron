import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Users,
  UserPlus,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Crown,
  User,
  FolderKanban,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "../../contexts/useToast";

// Confirmation Modal Component
function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel,
  isLoading,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isLoading ? onCancel : undefined}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
              <p className="text-sm text-neutral-500">This action cannot be undone</p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-4">
          <p className="text-sm text-neutral-700">{message}</p>
        </div>
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
import { UserRole } from "../../constants/roles";
import type {
  ProjectTeamsDTO,
  TeamDTO,
  TeamMemberDTO,
  CreateTeamRequest,
  UpdateTeamRequest,
} from "../../types/pmTypes";
import type { UserDto } from "../../types/userTypes";
import {
  searchProjectsWithTeams,
  getProjectTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  fetchAssignableUsers,
} from "../../api/pm";

const ROLE_LABELS: Record<number, string> = {
  1: "Admin",
  2: "Project Manager",
  3: "Team Lead",
  4: "Team Member",
};

const ROLE_COLORS: Record<number, string> = {
  1: "bg-purple-100 text-purple-700",
  2: "bg-blue-100 text-blue-700",
  3: "bg-emerald-100 text-emerald-700",
  4: "bg-neutral-100 text-neutral-700",
};

export default function PMManageTeamsPage() {
  const { showError, showSuccess } = useToast();

  // State
  const [projects, setProjects] = useState<ProjectTeamsDTO[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<ProjectTeamsDTO | null>(null);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Create Team Modal
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [selectedTeamLeadId, setSelectedTeamLeadId] = useState("");
  const [teamLeadSearch, setTeamLeadSearch] = useState("");
  const [availableTeamLeads, setAvailableTeamLeads] = useState<UserDto[]>([]);
  const [isLoadingTeamLeads, setIsLoadingTeamLeads] = useState(false);
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  // Edit Team Modal
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamDTO | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamDescription, setEditTeamDescription] = useState("");
  const [editTeamLeadId, setEditTeamLeadId] = useState("");
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false);

  // Add Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberTeamId, setAddMemberTeamId] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [availableMembers, setAvailableMembers] = useState<UserDto[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Delete/Remove Confirmation Modals
  const [deleteTeamModal, setDeleteTeamModal] = useState<TeamDTO | null>(null);
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const [removeMemberModal, setRemoveMemberModal] = useState<{ teamId: string; member: TeamMemberDTO } | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // Load all projects
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const results = await searchProjectsWithTeams(undefined);
      setProjects(results);
      
      // If only one project, auto-select it
      if (results.length === 1) {
        setSelectedProjectId(results[0].projectId);
        setSelectedProject(results[0]);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Initial load
  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  // Handle project selection from dropdown
  const handleProjectSelect = useCallback(async (projectId: string) => {
    setSelectedProjectId(projectId);
    if (!projectId) {
      setSelectedProject(null);
      return;
    }
    
    try {
      const project = await getProjectTeams(projectId);
      setSelectedProject(project);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load project teams");
    }
  }, [showError]);

  // Load team leads for create/edit modals
  const loadTeamLeads = useCallback(async (searchTerm?: string) => {
    try {
      setIsLoadingTeamLeads(true);
      const data = await fetchAssignableUsers({
        page: 1,
        pageSize: 50,
        searchTerm,
        role: UserRole.TeamLead,
      });
      setAvailableTeamLeads(data.items.filter(u => u.role === UserRole.TeamLead));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load team leads");
    } finally {
      setIsLoadingTeamLeads(false);
    }
  }, [showError]);

  // Load members for add member modal
  const loadMembers = useCallback(async (searchTerm?: string) => {
    try {
      setIsLoadingMembers(true);
      const data = await fetchAssignableUsers({
        page: 1,
        pageSize: 50,
        searchTerm,
        role: UserRole.TeamMember,
      });
      setAvailableMembers(data.items.filter(u => u.role === UserRole.TeamMember));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load team members");
    } finally {
      setIsLoadingMembers(false);
    }
  }, [showError]);

  useEffect(() => {
    if (showCreateTeamModal || showEditTeamModal) {
      void loadTeamLeads(teamLeadSearch);
    }
  }, [showCreateTeamModal, showEditTeamModal, teamLeadSearch, loadTeamLeads]);

  useEffect(() => {
    if (showAddMemberModal) {
      void loadMembers(memberSearch);
    }
  }, [showAddMemberModal, memberSearch, loadMembers]);

  // Refresh selected project data
  const refreshProjectTeams = useCallback(async () => {
    if (!selectedProject) return;
    try {
      const updated = await getProjectTeams(selectedProject.projectId);
      setSelectedProject(updated);
      setProjects(prev => 
        prev.map(p => p.projectId === updated.projectId ? updated : p)
      );
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to refresh project data");
    }
  }, [selectedProject, showError]);

  // Toggle team expansion
  const toggleTeamExpansion = (teamId: string) => {
    setExpandedTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  // Create Team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newTeamName.trim() || !selectedTeamLeadId) {
      showError("Please fill in all required fields");
      return;
    }

    try {
      setIsCreatingTeam(true);
      const request: CreateTeamRequest = {
        projectId: selectedProject.projectId,
        name: newTeamName.trim(),
        description: newTeamDescription.trim() || undefined,
        teamLeadId: selectedTeamLeadId,
      };
      await createTeam(request);
      showSuccess("Team created successfully");
      setShowCreateTeamModal(false);
      resetCreateTeamForm();
      await refreshProjectTeams();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const resetCreateTeamForm = () => {
    setNewTeamName("");
    setNewTeamDescription("");
    setSelectedTeamLeadId("");
    setTeamLeadSearch("");
  };

  // Edit Team
  const openEditTeamModal = (team: TeamDTO) => {
    setEditingTeam(team);
    setEditTeamName(team.name);
    setEditTeamDescription(team.description || "");
    setEditTeamLeadId(team.teamLeadId);
    setShowEditTeamModal(true);
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    try {
      setIsUpdatingTeam(true);
      const request: UpdateTeamRequest = {
        name: editTeamName.trim() !== editingTeam.name ? editTeamName.trim() : undefined,
        description: editTeamDescription.trim(),
        teamLeadId: editTeamLeadId !== editingTeam.teamLeadId ? editTeamLeadId : undefined,
      };
      await updateTeam(editingTeam.teamId, request);
      showSuccess("Team updated successfully");
      setShowEditTeamModal(false);
      setEditingTeam(null);
      await refreshProjectTeams();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to update team");
    } finally {
      setIsUpdatingTeam(false);
    }
  };

  // Delete Team
  const handleDeleteTeam = (team: TeamDTO) => {
    setDeleteTeamModal(team);
  };

  const confirmDeleteTeam = async () => {
    if (!deleteTeamModal) return;

    try {
      setIsDeletingTeam(true);
      await deleteTeam(deleteTeamModal.teamId);
      showSuccess("Team deleted successfully");
      setDeleteTeamModal(null);
      await refreshProjectTeams();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete team");
    } finally {
      setIsDeletingTeam(false);
    }
  };

  // Add Member
  const openAddMemberModal = (teamId: string) => {
    setAddMemberTeamId(teamId);
    setSelectedMemberId("");
    setMemberSearch("");
    setShowAddMemberModal(true);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMemberTeamId || !selectedMemberId) {
      showError("Please select a team member");
      return;
    }

    try {
      setIsAddingMember(true);
      await addTeamMember(addMemberTeamId, { userId: selectedMemberId });
      showSuccess("Member added successfully");
      setShowAddMemberModal(false);
      setAddMemberTeamId(null);
      setSelectedMemberId("");
      await refreshProjectTeams();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setIsAddingMember(false);
    }
  };

  // Remove Member
  const handleRemoveMember = (teamId: string, member: TeamMemberDTO) => {
    setRemoveMemberModal({ teamId, member });
  };

  const confirmRemoveMember = async () => {
    if (!removeMemberModal) return;

    try {
      setIsRemovingMember(true);
      await removeTeamMember(removeMemberModal.teamId, removeMemberModal.member.userId);
      showSuccess("Member removed successfully");
      setRemoveMemberModal(null);
      await refreshProjectTeams();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setIsRemovingMember(false);
    }
  };

  // Get existing member IDs for a team (to filter them out from add member list)
  const getExistingMemberIds = (team: TeamDTO): Set<string> => {
    const ids = new Set<string>();
    ids.add(team.teamLeadId); // Team lead
    team.members.forEach(m => ids.add(m.userId));
    return ids;
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="bg-white border border-neutral-300 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-neutral-900 text-white rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-neutral-900">Manage Teams</h1>
                <p className="text-sm text-neutral-600">
                  Select a project to manage its teams, team leads, and members
                </p>
              </div>
            </div>
          </div>

          {/* Project Dropdown */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Select Project
            </label>
            <div className="relative">
              <FolderKanban
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectSelect(e.target.value)}
                disabled={loading}
                className="w-full border border-neutral-300 rounded-md pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900 appearance-none bg-white disabled:bg-neutral-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loading ? "Loading projects..." : "-- Select a project --"}
                </option>
                {projects.map((project) => (
                  <option key={project.projectId} value={project.projectId}>
                    {project.projectCode} - {project.projectName} ({project.totalTeams} team{project.totalTeams !== 1 ? "s" : ""})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
            </div>
            {!loading && projects.length === 0 && (
              <p className="text-sm text-neutral-500 mt-2">No projects available</p>
            )}
          </div>
        </header>

        {/* Selected Project Teams */}
        {selectedProject && (
          <div className="bg-white border border-neutral-300 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  {selectedProject.projectName}
                </h2>
                <p className="text-sm text-neutral-500">
                  {selectedProject.totalTeams} team{selectedProject.totalTeams !== 1 ? "s" : ""} •{" "}
                  {selectedProject.totalMembers} total member{selectedProject.totalMembers !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setShowCreateTeamModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800"
              >
                <Plus size={16} />
                Create Team
              </button>
            </div>

            {/* Teams List */}
            {selectedProject.teams.length === 0 ? (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center">
                <Users className="mx-auto text-neutral-400 mb-2" size={32} />
                <p className="text-sm font-medium text-neutral-900">No teams yet</p>
                <p className="text-xs text-neutral-600 mt-1">
                  Create your first team to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedProject.teams.map((team) => (
                  <div
                    key={team.teamId}
                    className="rounded-lg border border-neutral-200"
                  >
                    {/* Team Header */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50"
                      onClick={() => toggleTeamExpansion(team.teamId)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedTeams.has(team.teamId) ? (
                          <ChevronDown size={20} className="text-neutral-500" />
                        ) : (
                          <ChevronRight size={20} className="text-neutral-500" />
                        )}
                        <div>
                          <p className="font-medium text-neutral-900">{team.name}</p>
                          {team.description && (
                            <p className="text-xs text-neutral-500">{team.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-neutral-600">
                            {team.memberCount + 1} member{team.memberCount + 1 !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openAddMemberModal(team.teamId)}
                            className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                            title="Add member"
                          >
                            <UserPlus size={16} />
                          </button>
                          <button
                            onClick={() => openEditTeamModal(team)}
                            className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
                            title="Edit team"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTeam(team)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete team"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Team Details (Expanded) */}
                    {expandedTeams.has(team.teamId) && (
                      <div className="border-t border-neutral-200 p-4 bg-neutral-50">
                        {/* Team Lead */}
                        <div className="mb-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
                            Team Lead
                          </p>
                          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-emerald-100 rounded-full">
                                <Crown size={16} className="text-emerald-700" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-neutral-900">
                                  {team.teamLeadName}
                                </p>
                                <p className="text-xs text-neutral-500">{team.teamLeadEmail}</p>
                              </div>
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded ${ROLE_COLORS[3]}`}>
                              {ROLE_LABELS[3]}
                            </span>
                          </div>
                        </div>

                        {/* Team Members */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                              Team Members ({team.memberCount})
                            </p>
                            <button
                              onClick={() => openAddMemberModal(team.teamId)}
                              className="text-xs text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
                            >
                              <UserPlus size={12} />
                              Add Member
                            </button>
                          </div>

                          {team.members.length === 0 ? (
                            <p className="text-xs text-neutral-500 p-3 bg-white rounded-lg border border-neutral-200">
                              No team members yet. Add members using the button above.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {team.members.map((member) => (
                                <div
                                  key={member.teamMemberId}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-neutral-100 rounded-full">
                                      <User size={16} className="text-neutral-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-neutral-900">
                                        {member.userName}
                                      </p>
                                      <p className="text-xs text-neutral-500">{member.email}</p>
                                      {(member.department || member.designation) && (
                                        <p className="text-xs text-neutral-400 mt-0.5">
                                          {[member.designation, member.department]
                                            .filter(Boolean)
                                            .join(" • ")}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-xs font-medium px-2 py-1 rounded ${
                                        ROLE_COLORS[member.role] || ROLE_COLORS[4]
                                      }`}
                                    >
                                      {ROLE_LABELS[member.role] || "Team Member"}
                                    </span>
                                    <button
                                      onClick={() => handleRemoveMember(team.teamId, member)}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                      title="Remove member"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateTeamModal && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-6">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Create New Team
              </h3>
              <p className="text-sm text-neutral-500 mb-4">
                Project: {selectedProject.projectName}
              </p>
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="e.g., Frontend Team, QA Team"
                    className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newTeamDescription}
                    onChange={(e) => setNewTeamDescription(e.target.value)}
                    placeholder="Brief description of the team"
                    rows={2}
                    className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Team Lead <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mb-2">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      type="text"
                      value={teamLeadSearch}
                      onChange={(e) => setTeamLeadSearch(e.target.value)}
                      placeholder="Search team leads..."
                      className="w-full border border-neutral-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                  <div className="border border-neutral-200 rounded-md max-h-48 overflow-y-auto">
                    {isLoadingTeamLeads ? (
                      <p className="text-sm text-neutral-500 p-3">Loading team leads...</p>
                    ) : availableTeamLeads.length === 0 ? (
                      <p className="text-sm text-neutral-500 p-3">No team leads found</p>
                    ) : (
                      availableTeamLeads.map((user) => (
                        <label
                          key={user.userId}
                          className="flex items-center gap-3 p-3 hover:bg-neutral-50 cursor-pointer border-b last:border-b-0"
                        >
                          <input
                            type="radio"
                            name="teamLead"
                            value={user.userId}
                            checked={selectedTeamLeadId === user.userId}
                            onChange={() => setSelectedTeamLeadId(user.userId)}
                            className="h-4 w-4 text-neutral-900"
                          />
                          <div>
                            <p className="text-sm font-medium text-neutral-900">
                              {user.displayName || `${user.firstName} ${user.lastName}`}
                            </p>
                            <p className="text-xs text-neutral-500">{user.email}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateTeamModal(false);
                      resetCreateTeamForm();
                    }}
                    className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTeam || !newTeamName.trim() || !selectedTeamLeadId}
                    className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-60"
                  >
                    {isCreatingTeam ? "Creating..." : "Create Team"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Team Modal */}
        {showEditTeamModal && editingTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-6">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Edit Team
              </h3>
              <form onSubmit={handleUpdateTeam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Team Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editTeamName}
                    onChange={(e) => setEditTeamName(e.target.value)}
                    className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editTeamDescription}
                    onChange={(e) => setEditTeamDescription(e.target.value)}
                    rows={2}
                    className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Team Lead <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mb-2">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      type="text"
                      value={teamLeadSearch}
                      onChange={(e) => setTeamLeadSearch(e.target.value)}
                      placeholder="Search team leads..."
                      className="w-full border border-neutral-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                  <div className="border border-neutral-200 rounded-md max-h-48 overflow-y-auto">
                    {isLoadingTeamLeads ? (
                      <p className="text-sm text-neutral-500 p-3">Loading team leads...</p>
                    ) : availableTeamLeads.length === 0 ? (
                      <p className="text-sm text-neutral-500 p-3">No team leads found</p>
                    ) : (
                      availableTeamLeads.map((user) => (
                        <label
                          key={user.userId}
                          className="flex items-center gap-3 p-3 hover:bg-neutral-50 cursor-pointer border-b last:border-b-0"
                        >
                          <input
                            type="radio"
                            name="editTeamLead"
                            value={user.userId}
                            checked={editTeamLeadId === user.userId}
                            onChange={() => setEditTeamLeadId(user.userId)}
                            className="h-4 w-4 text-neutral-900"
                          />
                          <div>
                            <p className="text-sm font-medium text-neutral-900">
                              {user.displayName || `${user.firstName} ${user.lastName}`}
                            </p>
                            <p className="text-xs text-neutral-500">{user.email}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditTeamModal(false);
                      setEditingTeam(null);
                    }}
                    className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingTeam || !editTeamName.trim() || !editTeamLeadId}
                    className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-60"
                  >
                    {isUpdatingTeam ? "Updating..." : "Update Team"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMemberModal && addMemberTeamId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-6">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Add Team Member
              </h3>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Search Members
                  </label>
                  <div className="relative mb-2">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Search by name or email..."
                      className="w-full border border-neutral-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                  </div>
                  <div className="border border-neutral-200 rounded-md max-h-64 overflow-y-auto">
                    {isLoadingMembers ? (
                      <p className="text-sm text-neutral-500 p-3">Loading members...</p>
                    ) : availableMembers.length === 0 ? (
                      <p className="text-sm text-neutral-500 p-3">No team members found</p>
                    ) : (
                      (() => {
                        const team = selectedProject?.teams.find(t => t.teamId === addMemberTeamId);
                        const existingIds = team ? getExistingMemberIds(team) : new Set<string>();
                        const filteredMembers = availableMembers.filter(
                          (u) => !existingIds.has(u.userId)
                        );

                        if (filteredMembers.length === 0) {
                          return (
                            <p className="text-sm text-neutral-500 p-3">
                              All available members are already in this team
                            </p>
                          );
                        }

                        return filteredMembers.map((user) => (
                          <label
                            key={user.userId}
                            className="flex items-center gap-3 p-3 hover:bg-neutral-50 cursor-pointer border-b last:border-b-0"
                          >
                            <input
                              type="radio"
                              name="selectedMember"
                              value={user.userId}
                              checked={selectedMemberId === user.userId}
                              onChange={() => setSelectedMemberId(user.userId)}
                              className="h-4 w-4 text-neutral-900"
                            />
                            <div>
                              <p className="text-sm font-medium text-neutral-900">
                                {user.displayName || `${user.firstName} ${user.lastName}`}
                              </p>
                              <p className="text-xs text-neutral-500">{user.email}</p>
                            </div>
                          </label>
                        ));
                      })()
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMemberModal(false);
                      setAddMemberTeamId(null);
                      setSelectedMemberId("");
                    }}
                    className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingMember || !selectedMemberId}
                    className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 disabled:opacity-60"
                  >
                    {isAddingMember ? "Adding..." : "Add Member"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Team Confirmation Modal */}
        <ConfirmationModal
          isOpen={deleteTeamModal !== null}
          title="Delete Team"
          message={`Are you sure you want to delete "${deleteTeamModal?.name ?? ""}"? All team members will be removed from this team.`}
          confirmLabel="Delete"
          isLoading={isDeletingTeam}
          onConfirm={confirmDeleteTeam}
          onCancel={() => setDeleteTeamModal(null)}
        />

        {/* Remove Member Confirmation Modal */}
        <ConfirmationModal
          isOpen={removeMemberModal !== null}
          title="Remove Member"
          message={`Are you sure you want to remove "${removeMemberModal?.member.userName ?? ""}" from this team?`}
          confirmLabel="Remove"
          isLoading={isRemovingMember}
          onConfirm={confirmRemoveMember}
          onCancel={() => setRemoveMemberModal(null)}
        />
      </div>
    </div>
  );
}
