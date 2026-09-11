import { Link, useLocation } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  Layers,
  Megaphone,
  Wallet,
  UserCircle,
  UserCog,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const LINKS = {
  admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/batches", label: "Batches", icon: Layers },
    { to: "/admin/staff", label: "Manage Staff", icon: UserCog },
    { to: "/notices", label: "Notices", icon: Megaphone },
    { to: "/profile", label: "Profile", icon: UserCircle },
  ],
  teacher: [
    { to: "/teacher", label: "Dashboard", icon: LayoutDashboard },
    { to: "/batches", label: "My Batches", icon: Layers },
    { to: "/notices", label: "Notices", icon: Megaphone },
    { to: "/profile", label: "Profile", icon: UserCircle },
  ],
  student: [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard },
    { to: "/batches", label: "Batches", icon: Layers },
    { to: "/payments", label: "Payments", icon: Wallet },
    { to: "/notices", label: "Notices", icon: Megaphone },
    { to: "/profile", label: "Profile", icon: UserCircle },
  ],
};

export default function Sidebar({ mobileOpen, onClose, onLogoutClick, collapsed, onToggleCollapse }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const links = LINKS[user.role] || [];
  const initials =
    user.name
      ?.split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  function renderContent(isCollapsed) {
    return (
      <div className="flex flex-col h-full">
        <div className={`flex items-center gap-2 h-16 shrink-0 ${isCollapsed ? "justify-center px-2" : "px-5"}`}>
          <div className="h-8 w-8 rounded-lg bg-amber-400 flex items-center justify-center shrink-0">
            <GraduationCap size={16} className="text-ink-900" />
          </div>
          {!isCollapsed && <span className="font-display text-lg text-white whitespace-nowrap">EduBatch</span>}
          <button
            className="ml-auto lg:hidden text-white/60 hover:text-white shrink-0"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden ${isCollapsed ? "px-3" : "px-3"}`}>
          {!isCollapsed && (
            <div className="px-3 text-[11px] font-medium tracking-wide text-white/35 mb-2">MENU</div>
          )}
          {links.map((l) => {
            const active = location.pathname === l.to;
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                onClick={onClose}
                title={isCollapsed ? l.label : undefined}
                className={`flex items-center rounded-lg text-sm font-medium transition ${
                  isCollapsed ? "justify-center h-11 w-11 mx-auto" : "gap-3 px-3 py-2.5"
                } ${
                  active
                    ? "bg-amber-400 text-ink-900"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={17} className="shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">{l.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/10 shrink-0">
          <div className={`flex items-center py-2 ${isCollapsed ? "justify-center" : "gap-3 px-2"}`}>
            <div
              className="h-9 w-9 rounded-full bg-amber-400 text-ink-900 flex items-center justify-center font-semibold text-sm shrink-0"
              title={isCollapsed ? `${user.name} (${user.role})` : undefined}
            >
              {initials}
            </div>
            {!isCollapsed && (
              <>
                <div className="min-w-0">
                  <div className="text-sm text-white truncate">{user.name}</div>
                  <div className="text-xs text-white/40 capitalize">{user.role}</div>
                </div>
                <button
                  onClick={onLogoutClick}
                  title="Logout"
                  className="ml-auto text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10 shrink-0"
                  aria-label="Logout"
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop sidebar - collapsible */}
      <aside
        className={`hidden lg:flex relative shrink-0 bg-ink-900 sticky top-0 h-screen transition-all duration-200 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {renderContent(collapsed)}

        {/* Collapse toggle - centered on the sidebar's right edge */}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex absolute top-1/2 -translate-y-1/2 -right-3 h-7 w-7 rounded-full bg-ink-900 border border-white/15 text-white/70 hover:text-white hover:bg-ink-700 items-center justify-center shadow-soft z-10"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Mobile drawer - always full width, unaffected by collapsed state */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/60 animate-fade-in"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-ink-900 animate-scale-in origin-top-left">
            {renderContent(false)}
          </aside>
        </div>
      )}
    </>
  );
}
