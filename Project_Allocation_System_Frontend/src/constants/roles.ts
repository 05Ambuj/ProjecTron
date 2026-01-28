/**
 * Mirrors backend enum: Project_Allocation_System.Models.UserRole
 * Do NOT reorder or renumber.
 * Compatible with `erasableSyntaxOnly`.
 */
export const UserRole = {
  Admin: 1,
  ProjectManager: 2,
  TeamLead: 3,
  TeamMember: 4,
} as const;

/**
 * Strongly-typed UserRole union (1 | 2 | 3 | 4)
 */
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/**
 * Human-readable labels.
 * Matches backend Display(Name = "...") usage.
 */
export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.Admin]: "Administrator",
  [UserRole.ProjectManager]: "Project Manager",
  [UserRole.TeamLead]: "Team Lead",
  [UserRole.TeamMember]: "Team Member",
};

/**
 * Role hierarchy level.
 * Mirrors backend UserRoleExtensions.GetHierarchyLevel()
 */
export const UserRoleHierarchy: Record<UserRole, number> = {
  [UserRole.Admin]: 4,
  [UserRole.ProjectManager]: 3,
  [UserRole.TeamLead]: 2,
  [UserRole.TeamMember]: 1,
};

/**
 * Role capability helpers.
 * Must stay in sync with backend UserRoleExtensions.
 */

export const canManageUsers = (role: UserRole): boolean => {
  return role === UserRole.Admin;
};

export const canManageProjects = (role: UserRole): boolean => {
  return role === UserRole.Admin || role === UserRole.ProjectManager;
};

export const canAssignWork = (role: UserRole): boolean => {
  return role === UserRole.Admin || role === UserRole.TeamLead;
};

export const canSelfRegister = (role: UserRole): boolean => {
  return (
    role === UserRole.ProjectManager ||
    role === UserRole.TeamLead ||
    role === UserRole.TeamMember
  );
};

/**
 * Utility comparisons
 */

export const hasEqualOrHigherRole = (
  role: UserRole,
  required: UserRole
): boolean => {
  return UserRoleHierarchy[role] >= UserRoleHierarchy[required];
};

export const hasHigherRole = (
  role: UserRole,
  comparedTo: UserRole
): boolean => {
  return UserRoleHierarchy[role] > UserRoleHierarchy[comparedTo];
};
