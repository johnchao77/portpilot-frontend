// src/components/ProtectedRoute.jsx
// 說明：簡易的前端保護機制，未登入則導回 /login 並給英文錯誤訊息
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // 讀取本地登入資訊（之後可替換為真正的 Auth 機制）
  const raw = localStorage.getItem("pp_auth");
  let isAuthed = false;

  try {
    const data = raw ? JSON.parse(raw) : null;
    isAuthed = !!(data && data.ok === true && data.token);
  } catch (e) {
    console.error("Invalid auth data in localStorage.");
  }

  const location = useLocation();

  if (!isAuthed) {
    // 這裡不彈窗，僅在 Console 提示；頁面自動導回 /login
    console.warn("Unauthorized: Please login first.");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
