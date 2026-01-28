import api from "../client";
import type { ApiResponse } from "../../types/types";
import type { UserDto } from "../../types/userTypes";
import { UserRoleLabels } from "../../constants/roles";

export interface UserProfileDto {
  email: string;
  displayName: string;
  roleDisplayName: string;
  department: string;
  phoneNumber: string;
  organizationName: string;
}

export interface UpdateUserProfileRequest {
  phoneNumber: string;
  department: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/* ---------------- Get My Profile ---------------- */
export async function fetchMyProfile(): Promise<UserProfileDto> {
  const res = await api.get<UserProfileDto>("/users/me");

  // Backend returns UserProfileDto directly, not wrapped in ApiResponse
  if (!res.data) {
    throw new Error("Failed to load profile");
  }

  return res.data;
}

/* ---------------- Update Profile ---------------- */
export async function updateMyProfile(
  request: UpdateUserProfileRequest,
): Promise<UserProfileDto> {
  const res = await api.put<ApiResponse<UserDto>>(
    "/users/me/profile",
    request,
  );

  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.message || "Failed to update profile");
  }

  // Backend returns UserDTO, convert to UserProfileDto
  const userDto = res.data.data;
  const roleDisplayName = UserRoleLabels[userDto.role as keyof typeof UserRoleLabels] || "Unknown";
  
  return {
    email: userDto.email,
    displayName: userDto.displayName,
    roleDisplayName: userDto.roleDisplayName || roleDisplayName,
    department: userDto.department || "",
    phoneNumber: userDto.phoneNumber || "",
    organizationName: userDto.organizationName || "",
  };
}

/* ---------------- Change Password ---------------- */
export async function changePassword(
  request: ChangePasswordRequest,
): Promise<void> {
  const res = await api.put<ApiResponse<boolean>>(
    "/users/me/password",
    request,
  );

  if (!res.data.success) {
    throw new Error(res.data.message || "Failed to change password");
  }
}