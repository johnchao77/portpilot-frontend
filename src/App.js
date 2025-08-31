// src/App.js
// 說明：集中設定網站路由；/dashboard 走 ProtectedRoute；/ 直接導到 /login
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PortPilotLoginPage from "./pages/PortPilotLoginPage";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import MyContainers from "./pages/MyContainers";
import Drayage from "./pages/Drayage";
import Warehouse from "./pages/Warehouse";
import Users from "./pages/Users";
import AdminHome from "./pages/AdminHome";
import AdminRoute from "./components/AdminRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 預設導向登入頁 */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PortPilotLoginPage />} />
        

        {/* 受保護的路由：必須登入才可進入 */}
        <Route path="/drayage" element={
          <ProtectedRoute>
            <Drayage />
          </ProtectedRoute>
        } />

        <Route path="/warehouse" element={
          <ProtectedRoute>
            <Warehouse />
          </ProtectedRoute>
        } />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-containers"
          element={
            <ProtectedRoute>
              <MyContainers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users" 
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />

      {/* Admin 區（只有 Admin 可進） */}
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

        {/* 舊路徑 → 新路徑（相容性重導） */}
        <Route path="/users" element={<Navigate to="/admin/users" replace />} />
        <Route path="/drayage" element={<Navigate to="/admin/drayage" replace />} />
        <Route path="/warehouse" element={<Navigate to="/admin/warehouse" replace />} />

        {/* 未匹配到的路徑，統一回登入頁 */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
