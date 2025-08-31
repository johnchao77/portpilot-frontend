// src/components/AdminRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

function getRole() {
  try {
    const auth = JSON.parse(localStorage.getItem("pp_auth") || "null");
    return (auth?.user?.role || "").toLowerCase();
  } catch {
    return "";
  }
}

export default function AdminRoute({ children }) {
  const role = getRole();
  if (role !== "admin") {
    return <Navigate to="/login" replace />;
  }
  // 先驗證已登入（沿用你現有的 ProtectedRoute）
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
