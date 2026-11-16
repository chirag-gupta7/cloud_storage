import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { HardDrive, Share2, Star, Trash2, LogOut, User, ArrowLeft } from "lucide-react";
import { useAuth } from "../state/auth.jsx";
import { Button } from "./components/Button.jsx";
import { IconButton } from "./components/IconButton.jsx";

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
          isActive ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50",
        ].join(" ")
      }
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [openUser, setOpenUser] = useState(false);
  const userMenuRef = useRef(null);
  const userButtonRef = useRef(null);

  useEffect(() => {
    if (!openUser) return;
    function onPointerDown(e) {
      const menuEl = userMenuRef.current;
      const buttonEl = userButtonRef.current;
      const target = e.target;
      if (!menuEl || !buttonEl) return;
      if (menuEl.contains(target) || buttonEl.contains(target)) return;
      setOpenUser(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpenUser(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openUser]);

  return (
    <div className="h-full bg-slate-50">
      <div className="mx-auto flex h-full max-w-7xl">
        <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-4 sticky top-0 h-screen overflow-y-auto">
          <div className="text-sm font-semibold text-slate-900">Cloud Storage</div>
          <div className="mt-4 flex flex-col gap-1">
            <NavItem to="/app/drive" icon={HardDrive} label="My Drive" />
            <NavItem to="/app/shared" icon={Share2} label="Shared with me" />
            <NavItem to="/app/shared-by-me" icon={Share2} label="Shared by me" />
            <NavItem to="/app/starred" icon={Star} label="Starred" />
            <NavItem to="/app/trash" icon={Trash2} label="Trash" />
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-6">
            <div className="flex items-center gap-2">
              <IconButton title="Back" type="button" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </IconButton>
              <Link to="/app/drive">
                <IconButton title="My Drive" type="button">
                  <HardDrive className="h-4 w-4" />
                </IconButton>
              </Link>
              <div className="text-sm font-semibold text-slate-900">Cloud Storage</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <IconButton
                  title="User"
                  type="button"
                  ref={userButtonRef}
                  onClick={() => setOpenUser((v) => !v)}
                >
                  <User className="h-4 w-4" />
                </IconButton>
                {openUser ? (
                  <div
                    ref={userMenuRef}
                    className="absolute right-0 top-11 z-20 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="text-xs text-slate-500">Signed in as</div>
                    <div className="mt-0.5 truncate text-sm font-medium text-slate-900">{user?.email || "—"}</div>
                    <div className="mt-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full justify-center"
                        onClick={() => {
                          setOpenUser(false);
                          logout();
                          navigate("/login", { replace: true });
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
