// Main layout — nav + footer on every page.
// "Built in the USA" in the footer. Non-negotiable.
import { Link, Outlet, useLocation } from "react-router-dom";
import { clsx } from "clsx";

const navLinks = [
  { to: "/", label: "Budget" },
  { to: "/issues", label: "Issues" },
  { to: "/tracker", label: "Tracker" },
  { to: "/report-card", label: "Report Card" },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-navy-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-navy-800 font-black text-sm">CO</span>
              </div>
              <span className="font-black text-xl tracking-tight">CivicOS</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden sm:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={clsx(
                    "px-3 py-2 rounded-md text-sm font-semibold transition-colors",
                    location.pathname === link.to
                      ? "bg-navy-600 text-white"
                      : "text-navy-200 hover:bg-navy-700 hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Report Issue CTA */}
            <Link
              to="/report"
              className="bg-civic-red hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-bold transition-colors"
            >
              Report Issue
            </Link>
          </div>

          {/* Mobile nav */}
          <nav className="sm:hidden flex items-center gap-1 pb-3 overflow-x-auto">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors",
                  location.pathname === link.to
                    ? "bg-navy-600 text-white"
                    : "text-navy-200 hover:bg-navy-700"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer — "Built in the USA" */}
      <footer className="bg-navy-900 text-navy-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-lg">CivicOS</span>
              <span className="text-sm">— Civic Transparency Platform</span>
            </div>
            <p className="text-sm font-bold text-white tracking-wide">
              Built in the USA
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-navy-700 text-center text-xs text-navy-400">
            Public data for the public good. Every dollar tracked. Every issue visible. Every official accountable.
          </div>
        </div>
      </footer>
    </div>
  );
}
