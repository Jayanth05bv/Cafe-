import { useNavigate, useLocation, Link } from "react-router-dom";
import { api } from "../api";

const ROLE_LABELS = {
  ADMIN: "Administrator",
  OWNER: "Owner",
  CHEF: "Chef",
  WAITER: "Waiter",
  CUSTOMER: "Customer",
};

export default function DashboardLayout({
  title,
  role,
  children,
  sidebarExtra,
  userEmail,
  brandTitle,
  navItemsOverride,
  showResetPasswordLink = true,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    api.setToken(null);
    navigate("/login");
  };

  const navItems = navItemsOverride || [
    { path: "/", label: "Home", roles: ["ADMIN", "OWNER", "CHEF", "WAITER", "CUSTOMER"] },
    { path: "/admin", label: "Dashboard", roles: ["ADMIN"] },
    { path: "/owner", label: "Dashboard", roles: ["OWNER"] },
    { path: "/owner/select-cafe", label: "Cafes", roles: ["OWNER"] },
    { path: "/owner/accept", label: "Accept", roles: ["OWNER"] },
    { path: "/chef", label: "Dashboard", roles: ["CHEF"] },
    { path: "/waiter", label: "Dashboard", roles: ["WAITER"] },
    { path: "/user", label: "Dashboard", roles: ["CUSTOMER"] },
  ].filter((item) => item.roles.includes(role));

  return (
    <div className="dashboard-layout">
      <aside className={`dashboard-sidebar dashboard-sidebar-${String(role || "").toLowerCase()} ${role === "ADMIN" ? "dashboard-sidebar-admin" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">{role ? role[0] : "D"}</div>
          <div className="sidebar-brand-copy">
            <span className="sidebar-brand-title">{brandTitle || "Digital Cafe"}</span>
            <span className="sidebar-brand-subtitle">{ROLE_LABELS[role] || "Workspace"}</span>
          </div>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-avatar">{role ? role[0] : "?"}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{title || "User"}</span>
            <span className="sidebar-user-role">{ROLE_LABELS[role] || role}</span>
          </div>
        </div>
        <div className="sidebar-nav-label">Navigation</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={(item.path || item.key || item.label) + item.label}
              type="button"
              className={`sidebar-link ${(item.active ?? (location.pathname === item.path)) ? "active" : ""}`}
              onClick={() => {
                if (item.onClick) item.onClick();
                else if (item.path) navigate(item.path);
              }}
            >
              {item.label}
            </button>
          ))}
          {showResetPasswordLink && role !== "ADMIN" && role !== "CUSTOMER" && (
            <Link
              to="/forgot-password"
              className="sidebar-link"
              state={userEmail ? { email: userEmail } : undefined}
            >
              Reset password
            </Link>
          )}
        </nav>
        {sidebarExtra && <div className="sidebar-extra">{sidebarExtra}</div>}
        <div className="sidebar-footer">
          <button type="button" className="sidebar-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
