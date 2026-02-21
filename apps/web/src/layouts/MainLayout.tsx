import { NavLink, Outlet } from "react-router-dom";
import { ToastContainer } from "@/components/toast/Toast";
import { ToastContext } from "@/contexts/ToastContext";
import { useToast } from "@/hooks/useToast";
import "@/styles/main-layout.css";

export default function MainLayout() {
  const { toasts, addToast, removeToast } = useToast();

  return (
    <ToastContext.Provider value={{ addToast }}>
      <div className="app-shell">
        <header className="app-header">
          <div className="app-header__logo">Logo</div>
          <div className="app-header__user">User Menu</div>
        </header>

        <aside className="app-sidebar">
          <nav className="app-sidebar__nav">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `app-sidebar__link${isActive ? " app-sidebar__link--active" : ""}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/connections"
              className={({ isActive }) =>
                `app-sidebar__link${isActive ? " app-sidebar__link--active" : ""}`
              }
            >
              Connections
            </NavLink>
            <NavLink
              to="/datasets"
              className={({ isActive }) =>
                `app-sidebar__link${isActive ? " app-sidebar__link--active" : ""}`
              }
            >
              Datasets
            </NavLink>
            <NavLink
              to="/dimensions"
              className={({ isActive }) =>
                `app-sidebar__link${isActive ? " app-sidebar__link--active" : ""}`
              }
            >
              Dimensoes
            </NavLink>
            <NavLink
              to="/metrics"
              className={({ isActive }) =>
                `app-sidebar__link${isActive ? " app-sidebar__link--active" : ""}`
              }
            >
              Metricas
            </NavLink>
          </nav>
        </aside>

        <main className="app-main">
          <Outlet />
        </main>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}
