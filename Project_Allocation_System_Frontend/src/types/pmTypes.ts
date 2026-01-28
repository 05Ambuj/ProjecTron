export interface PMDashboardStats {
  projectsCount: number;
  activeSprints: number;
  openTasks: number;
  overdueTasks: number;
}

export interface ProjectAllocationDTO {
  allocationId: string;
  userId: string;
  userName: string;
  email: string;
  role: number;
  teamName: string;
  createdDate: string;
}

export interface AssignUserRequest {
  userId: string;
  teamName?: string;
}

// Team Management Types
export interface TeamDTO {
  teamId: string;
  projectId: string;
  projectName: string;
  name: string;
  description?: string;
  teamLeadId: string;
  teamLeadName: string;
  teamLeadEmail: string;
  memberCount: number;
  isActive: boolean;
  createdDate: string;
  members: TeamMemberDTO[];
}

export interface TeamMemberDTO {
  teamMemberId: string;
  userId: string;
  userName: string;
  email: string;
  department?: string;
  designation?: string;
  role: number;
  joinedDate: string;
  isActive: boolean;
}

export interface CreateTeamRequest {
  projectId: string;
  name: string;
  description?: string;
  teamLeadId: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  teamLeadId?: string;
}

export interface AddTeamMemberRequest {
  userId: string;
}

export interface ProjectTeamsDTO {
  projectId: string;
  projectName: string;
  projectCode: string;
  projectManagerName: string;
  totalTeams: number;
  totalMembers: number;
  teams: TeamDTO[];
}