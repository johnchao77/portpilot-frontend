// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";

import PortPilotLoginPage from "./pages/PortPilotLoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Sidebar from "./components/layout/Sidebar";
import UserMenu from "./components/layout/UserMenu";

import Dashboard from "./pages/Dashboard";
import MyContainers from "./pages/MyContainers";
import Drayage from "./pages/Drayage";
import Warehouse from "./pages/Warehouse";
import Users from "./pages/Users";
import AdminHome from "./pages/AdminHome";

// 唯一的版型：左邊 Sidebar，右上角二 Logout, 右上角一 UserMenu，內容用 <Outlet />
function AppShell() {
  const navigate = useNavigate();

  const handleLogout = React.useCallback(() => {
    try {
      localStorage.removeItem("pp_auth");
      localStorage.removeItem("pp_user");
    } finally {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col">
        {/* 頂欄：右側放登出 icon + Avatar */}
        {/* 右上頂欄：sticky + z-30，避免被內容覆蓋 */}
        <div className="sticky top-0 z-30 h-12 border-b bg-white flex items-center justify-end px-4 gap-2">
          {/* Logout icon button */}
          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
            data-pp-logout
            className="h-9 w-9 grid place-items-center rounded-md border text-gray-600 hover:bg-gray-50"
          >
            {/* inline SVG：登出圖示（無需外部套件） */}
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </button>

          {/* 右邊 Avatar / 個人選單 */}
          <UserMenu />
        </div>

        {/* 內頁內容 */}
        <div className="flex-1 overflow-auto p-3">
          <Outlet />
        </div>
      </main>
    </div>
  );
}


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 預設導向登入 */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PortPilotLoginPage />} />

        {/* 所有登入後頁面都用同一個 AppShell（=> Sidebar 只渲染一次） */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          {/* 一般頁面 */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-containers" element={<MyContainers />} />

          {/* Admin 區（權限再套 AdminRoute） */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminHome />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/drayage"
            element={
              <AdminRoute>
                <Drayage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/warehouse"
            element={
              <AdminRoute>
                <Warehouse />
              </AdminRoute>
            }
          />

          {/* 舊路徑相容性轉向（可留可拿掉） */}
          <Route path="/users" element={<Navigate to="/admin/users" replace />} />
          <Route path="/drayage" element={<Navigate to="/admin/drayage" replace />} />
          <Route path="/warehouse" element={<Navigate to="/admin/warehouse" replace />} />
        </Route>

        {/* 其它不匹配的路徑一律回登入 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
