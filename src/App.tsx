import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Varieties from "./pages/Varieties";
import Groups from "./pages/Groups";
import Sarees from "./pages/Sarees";
import Login from "./pages/Login";

/* -------------------- AUTH HELPER -------------------- */
/* JWT-based authentication (ACCESS TOKEN = source of truth) */

const useAuth = () => {
  const token = localStorage.getItem("token");
  return { isAuthenticated: !!token };
};

/* -------------------- ROUTE GUARDS -------------------- */

const PrivateRoutes = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const PublicRoutes = () => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Outlet />
  );
};

/* -------------------- APP -------------------- */

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ---------- Public Routes ---------- */}
        <Route element={<PublicRoutes />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* ---------- Private Routes ---------- */}
        <Route element={<PrivateRoutes />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sarees" element={<Sarees />} />
          <Route path="/varieties" element={<Varieties />} />
          <Route path="/groups" element={<Groups />} />
        </Route>

        {/* ---------- Fallback ---------- */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;
