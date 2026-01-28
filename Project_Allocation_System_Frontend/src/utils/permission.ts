import { UserRole } from "../constants/roles";
import type { UserRole as UserRoleType } from "../constants/roles";

export function canCreateProject(role: UserRoleType): boolean {
  return role === UserRole.Admin;
}

export function canManageProjects(role: UserRoleType): boolean {
  return role === UserRole.Admin || role === UserRole.ProjectManager;
}

export function canAssignWork(role: UserRoleType): boolean {
  return (
    role === UserRole.Admin ||
    role === UserRole.ProjectManager ||
    role === UserRole.TeamLead
  );
}

export function canManageAllocations(role: UserRoleType): boolean {
  return role === UserRole.Admin || role === UserRole.ProjectManager;
}
