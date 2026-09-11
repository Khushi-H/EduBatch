import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Menu, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import ConfirmModal from "./ConfirmModal";
import Loader from "./Loader";

const TITLES = {
  "/admin": "Dashboard",
  "/teacher": "Dashboard",
  "/student": "Dashboard",
  "/batches": "Batches",
  "/payments": "Payments",
  "/notices": "Notices",
  "/profile": "Profile",
};

export default function AppShell() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebarCollapsed") === "true",
  );

  function toggleCollapsed() {
    setCollapsed((c) => {
      localStorage.setItem("sidebarCollapsed", String(!c));
      return !c;
    });
  }

  if (loading) return <Loader label="Loading your workspace..." />;
  // Not logged in - render the outlet, the ProtectedRoute inside will redirect to /login
  if (!user) return <Outlet />;

  function handleConfirmLogout() {
    setConfirmOpen(false);
    logout();
    navigate("/login");
  }

  const pageTitle =
    TITLES[location.pathname] ||
    (location.pathname.startsWith("/batches/") ? "Batch Details" : "EduBatch");

  return (
    <div className="min-h-screen flex bg-parchment">
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onLogoutClick={() => setConfirmOpen(true)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-ink-100 bg-white/85 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden text-ink-600 p-1.5 -ml-1.5 rounded-lg hover:bg-ink-50 shrink-0"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-display text-lg text-ink-800 truncate">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              className="p-2 rounded-lg text-ink-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => setConfirmOpen(true)}
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Confirm logout"
        message="Are you sure you want to log out of EduBatch? You'll need to sign in again to access your dashboard."
        confirmLabel="Logout"
        variant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
