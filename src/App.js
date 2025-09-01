// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import PortPilotLoginPage from "./pages/PortPilotLoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Sidebar from "./components/layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import MyContainers from "./pages/MyContainers";
import Drayage from "./pages/Drayage";
import Warehouse from "./pages/Warehouse";
import Users from "./pages/Users";
import AdminHome from "./pages/AdminHome";

function AppShell() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("pp_sidebar_collapsed") === "1"; }
    catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem("pp_sidebar_collapsed", collapsed ? "1" : "0"); }
    catch {}
  }, [collapsed]);

  return (
    // h-screen + overflow-hidden：頁面本體不捲動；只讓右側 main 捲
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      <main className="flex-1 overflow-auto p-3">
        <Outlet />
      </main>
    </div>
  );
}
export { AppShell };

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
