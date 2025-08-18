// src/App.js
// 說明：集中設定網站路由；/dashboard 走 ProtectedRoute；/ 直接導到 /login
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PortPilotLoginPage from "./pages/PortPilotLoginPage";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 預設導向登入頁 */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<PortPilotLoginPage />} />

        {/* 受保護的路由：必須登入才可進入 */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* 未匹配到的路徑，統一回登入頁 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
