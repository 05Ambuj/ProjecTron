export interface UserDto {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  department: string;
  phoneNumber?: string;
  role: number;
  roleDisplayName?: string;
  designation?: string;
  isActive: boolean;
  organizationId: string;
  organizationName?: string;
  createdDate?: string;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}