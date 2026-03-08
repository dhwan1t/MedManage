import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  // Don't render navbar on the demo page itself (it has its own full-screen layout)
  if (location.pathname === "/demo") return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getDashboardPath = () => {
    if (!user) return "/";
    switch (user.role) {
      case "ambulance":
        return "/ambulance";
      case "hospital":
        return "/hospital";
      case "admin":
        return "/admin";
      default:
        return "/";
    }
  };

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
      isActive(path)
        ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
    }`;

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 backdrop-blur-sm bg-white/90 dark:bg-gray-900/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo + Nav Links */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Logo */}
            <Link
              to={isAuthenticated ? getDashboardPath() : "/"}
              className="flex items-center gap-2 mr-4 shrink-0"
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m3-4h1m-1 4h1m-5 8h8"
                  />
                </svg>
              </div>
              <span className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight hidden sm:inline">
                Med
                <span className="text-indigo-600 dark:text-indigo-400">
                  Manage
                </span>
              </span>
            </Link>

            {/* PUBLIC role links (or not authenticated) */}
            {(!isAuthenticated || user?.role === "public") && (
              <>
                <Link to="/alerts" className={linkClass("/alerts")}>
                  Disease Alerts
                </Link>
                <Link to="/symptoms" className={linkClass("/symptoms")}>
                  Symptom Checker
                </Link>
                {isAuthenticated && (
                  <Link
                    to="/request-ambulance"
                    className={linkClass("/request-ambulance")}
                  >
                    Request Ambulance
                  </Link>
                )}
              </>
            )}

            {/* AMBULANCE role links */}
            {isAuthenticated && user?.role === "ambulance" && (
              <>
                <Link to="/ambulance" className={linkClass("/ambulance")}>
                  Dashboard
                </Link>
              </>
            )}

            {/* HOSPITAL role links */}
            {isAuthenticated && user?.role === "hospital" && (
              <>
                <Link to="/hospital" className={linkClass("/hospital")}>
                  Dashboard
                </Link>
                <Link
                  to="/hospital/beds"
                  className={linkClass("/hospital/beds")}
                >
                  Bed Management
                </Link>
                <Link
                  to="/hospital/queue"
                  className={linkClass("/hospital/queue")}
                >
                  Priority Queue
                </Link>
              </>
            )}

            {/* ADMIN role links */}
            {isAuthenticated && user?.role === "admin" && (
              <>
                <Link to="/admin" className={linkClass("/admin")}>
                  Dashboard
                </Link>
                <Link
                  to="/admin/analytics"
                  className={linkClass("/admin/analytics")}
                >
                  Analytics
                </Link>
                <Link
                  to="/admin/ratings"
                  className={linkClass("/admin/ratings")}
                >
                  Hospital Ratings
                </Link>
                <Link to="/admin/map" className={linkClass("/admin/map")}>
                  Live Map
                </Link>
              </>
            )}
          </div>

          {/* Right: Demo Mode + Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Demo Mode — only visible when logged in */}
            {isAuthenticated && (
              <Link
                to="/demo"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse shadow-[0_0_6px_rgba(134,239,172,0.8)]" />
                <span className="hidden sm:inline">Demo Mode</span>
                <span className="sm:hidden">Demo</span>
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* User badge */}
                <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                    {(user?.name || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                    {user?.name || "User"}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                    {user?.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
