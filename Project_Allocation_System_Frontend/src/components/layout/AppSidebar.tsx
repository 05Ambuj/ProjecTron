import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState } from "react";
import type { RootState } from "../../app/store";
import {
  LayoutDashboard,
  Building2,
  Users,
  FolderKanban,
  CheckSquare,
  Columns,
  Clock,
  BarChart3,
  ShieldCheck,
  Zap,
  ListTodo,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import type { UserRole } from "../../constants/roles";

type AppRole = UserRole;

const navItems = [ 
  {
    section: "General",
    roles: [1] as AppRole[],
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        to: "/admin",
      },
    ],
  },
 
  {
    section: "Organization",
    roles: [1] as AppRole[],
    items: [
      {
        label: "Organizations",
        to: "/admin/organizations",
        icon: Building2,
      },
      {
        label: "Users & Roles",
        to: "/admin/users",
        icon: Users,
      },
    ],
  },
 
  {
    section: "Delivery",
    roles: [1] as AppRole[],
    items: [
      {
        label: "Projects",
        to: "/admin/projects",
        icon: FolderKanban,
      },
    ],
  },
 
  {
    section: "Insights",
    roles: [1] as AppRole[],
    items: [
      {
        label: "Reports & Analytics",
        to: "/admin/reports",
        icon: BarChart3,
      },
    ],
  },
 
  {
    section: "System",
    roles: [1] as AppRole[],
    items: [
      {
        label: "Audit Logs",
        to: "/admin/audit-logs",
        icon: ShieldCheck,
      },
    ],
  },
 
  {
    section: "General",
    roles: [2] as AppRole[],
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        to: "/pm/dashboard",
      },
    ],
  },
 
  {
    section: "Projects",
    roles: [2] as AppRole[],
    items: [
      {
        label: "My Projects",
        to: "/pm/projects",
        icon: FolderKanban,
      },
      {
        label: "Manage Teams",
        to: "/pm/teams",
        icon: Users,
      },
    ],
  },
 
  {
    section: "Sprints",
    roles: [2] as AppRole[],
    items: [
      {
        label: "Active Sprints",
        to: "/pm/sprints/active",
        icon: Zap,
      },
      {
        label: "Sprint Planning",
        to: "/pm/sprints/planning",
        icon: ListTodo,
      },
      {
        label: "Sprint Stats",
        to: "/pm/sprints/stats",
        icon: TrendingUp,
      },
    ],
  },
 
  {
    section: "Tasks",
    roles: [2] as AppRole[],
    items: [
      {
        label: "All Tasks",
        to: "/pm/tasks/all",
        icon: CheckSquare,
      },
      {
        label: "Task Board",
        to: "/pm/tasks/board",
        icon: Columns,
      },
      {
        label: "Overdue Tasks",
        to: "/pm/tasks/overdue",
        icon: AlertCircle,
      },
      {
        label: "Not Started",
        to: "/pm/tasks/not-started",
        icon: Clock,
      },
    ],
  }, 

  {
    section: "General",
    roles: [3] as AppRole[],
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        to: "/tl/dashboard",
      },
    ],
  },

  {
    section: "Tasks",
    roles: [3] as AppRole[],
    items: [
      {
        label: "Create Task",
        to: "/tl/tasks/create",
        icon: CheckSquare,
      },
      {
        label: "All Tasks",
        to: "/tl/tasks/all",
        icon: ListTodo,
      },
      {
        label: "My Tasks",
        to: "/tl/tasks/my-tasks",
        icon: CheckSquare,
      },
      {
        label: "Task Board",
        to: "/tl/tasks/board",
        icon: Columns,
      },
      {
        label: "Overdue Tasks",
        to: "/tl/tasks/overdue",
        icon: AlertCircle,
      },
      {
        label: "Not Started",
        to: "/tl/tasks/not-started",
        icon: Clock,
      },
    ],
  },

  {
    section: "Projects",
    roles: [3] as AppRole[],
    items: [
      {
        label: "My Projects",
        to: "/tl/projects",
        icon: FolderKanban,
      },
    ],
  },

  {
    section: "Sprints",
    roles: [3] as AppRole[],
    items: [
      {
        label: "Active Sprints",
        to: "/tl/sprints/active",
        icon: Zap,
      },
      {
        label: "Sprint Stats",
        to: "/tl/sprints/stats",
        icon: TrendingUp,
      },
    ],
  },
 
  {
    section: "General",
    roles: [4] as AppRole[],
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        to: "/tm/dashboard",
      },
    ],
  },

  {
    section: "Tasks",
    roles: [4] as AppRole[],
    items: [
      {
        label: "My Tasks",
        to: "/tm/tasks/my-tasks",
        icon: CheckSquare,
      },
      {
        label: "Task Board",
        to: "/tm/tasks/board",
        icon: Columns,
      },
    ],
  },

  {
    section: "Projects",
    roles: [4] as AppRole[],
    items: [
      {
        label: "My Projects",
        to: "/tm/projects",
        icon: FolderKanban,
      },
    ],
  },

  {
    section: "Sprints",
    roles: [4] as AppRole[],
    items: [
      {
        label: "Active Sprints",
        to: "/tm/sprints/active",
        icon: Zap,
      },
      {
        label: "Sprint Stats",
        to: "/tm/sprints/stats",
        icon: TrendingUp,
      },
    ],
  },
];

export default function AppSidebar() {
  const user = useSelector((state: RootState) => state.auth.user);
  const role = user?.role as AppRole;
  const [expanded, setExpanded] = useState(false);

  const getRoleLabel = (roleNum: AppRole): string => {
    switch (roleNum) {
      case 1:
        return "Admin";
      case 2:
        return "Project Manager";
      case 3:
        return "Team Lead";
      case 4:
        return "Team Member";
      default:
        return "User";
    }
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40
        bg-neutral-900 text-neutral-300
        transition-[width] duration-300 ease-out
        ${expanded ? "w-64" : "w-16"}
      `}
    >
      {/* Header */}
      <div className="h-16 flex items-center px-4 text-white font-semibold border-b border-neutral-800">
        {expanded ? (
          <div className="flex flex-col">
            <span className="text-sm">Project Management</span>
            <span className="text-xs text-neutral-400">
              {getRoleLabel(role)}
            </span>
          </div>
        ) : (
          "PMS"
        )}
      </div>

      {/* Hover Expand Zone */}
      <div
        className="h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <nav className="py-4 space-y-6">
          {navItems
            .filter((group) => group.roles.includes(role))
            .map((group) => (
              <div key={group.section}>
                {expanded && (
                  <p className="px-4 mb-2 text-xs uppercase tracking-wide text-neutral-500">
                    {group.section}
                  </p>
                )}

                <ul className="space-y-1">
                  {group.items.map(({ label, to, icon: Icon }) => {
                    return (
                      <li key={label}>
                        <NavLink
                          to={to}
                          end={label === "Dashboard" || label === "My Projects"}
                          className={({ isActive }) =>
                            `
                              flex items-center gap-3
                              px-4 py-2 text-sm
                              transition-colors
                              ${
                                isActive
                                  ? "bg-neutral-800 text-white border-l-2 border-blue-500"
                                  : "hover:bg-neutral-800 hover:text-white"
                              }
                            `
                          }
                        >
                          <Icon size={18} className="shrink-0" />
                          {expanded && <span className="truncate">{label}</span>}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
        </nav>
      </div>
    </aside>
  );
}
