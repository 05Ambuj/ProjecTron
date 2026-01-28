import { useEffect, useState } from "react";
import {
  fetchMyProfile,
  updateMyProfile,
  changePassword,
  type UserProfileDto,
} from "../../api/profile";
import { useToast } from "../../contexts/useToast";
import {
  User,
  Mail,
  Building2,
  Phone,
  Lock,
  Save,
  X,
} from "lucide-react";

export default function ProfilePage() {
  const { showSuccess, showError } = useToast();

  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

  // Profile form state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await fetchMyProfile();
      setProfile(data);
      setPhoneNumber(data.phoneNumber || "");
      setDepartment(data.department || "");
    } catch (e) {
      showError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile() {
    if (!phoneNumber.trim() || !department.trim()) {
      showError("Phone number and department are required");
      return;
    }

    try {
      setSaving(true);
      const updated = await updateMyProfile({
        phoneNumber: phoneNumber.trim(),
        department: department.trim(),
      });
      setProfile(updated);
      showSuccess("Profile updated successfully");
    } catch (e) {
      showError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showError("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      showError("New password must be at least 8 characters");
      return;
    }

    try {
      setPasswordSaving(true);
      await changePassword({
        currentPassword,
        newPassword,
      });
      showSuccess("Password changed successfully");
      resetPasswordFields();
      setPasswordModalOpen(false);
    } catch (e) {
      showError((e as Error).message);
    } finally {
      setPasswordSaving(false);
    }
  }

  function resetPasswordFields() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  const hasProfileChanges =
    profile &&
    (phoneNumber !== profile.phoneNumber ||
      department !== profile.department);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">My Account</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Manage your profile information and account settings
        </p>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-full bg-primary-100">
            <User size={24} className="text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">
              Profile Information
            </h2>
            <p className="text-sm text-neutral-500">
              Update your contact information
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Email (Read-only) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
              <Mail size={16} />
              Email Address
            </label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2 text-sm text-neutral-500 cursor-not-allowed"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Email address cannot be changed
            </p>
          </div>

          {/* Display Name (Read-only) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
              <User size={16} />
              Display Name
            </label>
            <input
              type="text"
              value={profile.displayName}
              disabled
              className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2 text-sm text-neutral-500 cursor-not-allowed"
            />
          </div>

          {/* Role (Read-only) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
              Role
            </label>
            <input
              type="text"
              value={profile.roleDisplayName}
              disabled
              className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2 text-sm text-neutral-500 cursor-not-allowed"
            />
          </div>

          {/* Organization (Read-only) */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
              <Building2 size={16} />
              Organization
            </label>
            <input
              type="text"
              value={profile.organizationName}
              disabled
              className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-2 text-sm text-neutral-500 cursor-not-allowed"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
              <Phone size={16} />
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              maxLength={12}
              placeholder="Enter phone number"
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Maximum 12 characters
            </p>
          </div>

          {/* Department */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
              Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              maxLength={100}
              placeholder="Enter department"
              className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Maximum 100 characters
            </p>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 sticky bottom-0 z-20 bg-white/95 backdrop-blur supports-backdrop-filter:backdrop-blur shadow-[0_-6px_12px_-8px_rgba(0,0,0,0.15)]">
            {!hasProfileChanges && (
              <span className="text-xs text-neutral-500">No changes to save</span>
            )}
            <button
              type="button"
              onClick={handleUpdateProfile}
              disabled={!hasProfileChanges || saving}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-full bg-amber-100">
            <Lock size={24} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">
              Change Password
            </h2>
            <p className="text-sm text-neutral-500">
              Update your account password
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm text-neutral-700">
              Keep your account secure with a strong password.
            </p>
            <p className="text-xs text-neutral-500">
              You will be asked for your current password before saving.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetPasswordFields();
              setPasswordModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm"
          >
            <Lock size={16} />
            Change Password
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] px-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  Change Password
                </h3>
                <p className="text-sm text-neutral-500">
                  Enter your current and new password to continue.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetPasswordFields();
                  setPasswordModalOpen(false);
                }}
                className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                  <Lock size={16} />
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Minimum 8 characters
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 bg-neutral-50 rounded-b-xl">
              <button
                type="button"
                onClick={() => {
                  resetPasswordFields();
                  setPasswordModalOpen(false);
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={passwordSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                <Lock size={16} />
                {passwordSaving ? "Changing..." : "Save Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}