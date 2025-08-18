// src/App.js
// 說明：此檔案負責設定前端路由。預設路徑 "/" 為登入頁；
//      登入成功後導向 "/dashboard"（暫時先在此檔案內提供一個簡單的頁面）。
// 注意：需要先安裝 react-router-dom：npm install react-router-dom

import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import PortPilotLoginPage from "./PortPilotLoginPage";

// 簡單的 Dashboard 佔位頁（先用在本檔案內，未來你可以改成獨立檔案）
function Dashboard() {
  // 中文註解：這裡只是臨時歡迎頁，之後可替換成真正的儀表板元件
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="rounded-2xl bg-white px-8 py-6 shadow-lg text-center">
        <h1 className="text-2xl font-bold text-blue-600 mb-3">Welcome to PortPilot</h1>
        <p className="text-gray-700 mb-6">
          You have successfully signed in. This is a temporary dashboard page.
        </p>
        <Link
          to="/"
          className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Back to Sign in
        </Link>
      </div>
    </div>
  );
}

// 404 頁面
function NotFound() {
  // 中文註解：找不到路由時的回應頁
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="rounded-2xl bg-white px-8 py-6 shadow-lg text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-3">404 Not Found</h1>
        <p className="text-gray-700 mb-6">The page you are looking for does not exist.</p>
        <Link
          to="/"
          className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Go to Sign in
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  // 中文註解：設定路由對應的元件
  return (
    <BrowserRouter>
      <Routes>
        {/* 根路徑：登入頁 */}
        <Route path="/" element={<PortPilotLoginPage />} />

        {/* 登入成功後導向的暫時 Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* 相容舊路徑或導向需求，可視需要保留範例：
            <Route path="/home" element={<Navigate to="/dashboard" replace />} /> */}

        {/* 其他所有路徑 → 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
