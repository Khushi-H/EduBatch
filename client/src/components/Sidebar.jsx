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

export default function Sidebar({ mobileOpen, onClose, onLogoutClick }) {
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

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-5 h-16 shrink-0">
        <div className="h-8 w-8 rounded-lg bg-amber-400 flex items-center justify-center shrink-0">
          <GraduationCap size={16} className="text-ink-900" />
        </div>
        <span className="font-display text-lg text-white">EduBatch</span>
        <button
          className="ml-auto lg:hidden text-white/60 hover:text-white"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 text-[11px] font-medium tracking-wide text-white/35 mb-2">
          MENU
        </div>
        {links.map((l) => {
          const active = location.pathname === l.to;
          const Icon = l.icon;
          return (
            <Link
              key={l.to}
              to={l.to}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active
                  ? "bg-amber-400 text-ink-900"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={17} />
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-9 w-9 rounded-full bg-amber-400 text-ink-900 flex items-center justify-center font-semibold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm text-white truncate">{user.name}</div>
            <div className="text-xs text-white/40 capitalize">{user.role}</div>
          </div>
          <button
            onClick={onLogoutClick}
            className="ml-auto text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10 shrink-0"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-ink-900 sticky top-0 h-screen">
        {content}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/60 animate-fade-in"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-ink-900 animate-scale-in origin-top-left">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
