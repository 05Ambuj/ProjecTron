import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import type { RootState } from "../../app/store";
import { logout } from "../../features/auth/authSlice";

export default function TopBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s: RootState) => s.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="h-16 flex items-center justify-end px-6 border-b border-neutral-200 bg-white">
      <div className="flex items-center gap-6">
        {/* User Identity */}
        <button
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900 transition-colors"
        >
          <User size={16} />
          <span className="font-medium">
            {user?.displayName || user?.email}
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
