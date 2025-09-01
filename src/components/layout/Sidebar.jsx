// src/components/layout/Sidebar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getCurrentUser, isAdmin } from "../../utils/auth.js";
import UserMenu from "./UserMenu";

export default function Sidebar({ collapsed = false, onToggle }) {
  const me = getCurrentUser();
  const admin = isAdmin();
  const navigate = useNavigate();

  const widthCls  = collapsed ? "w-16" : "w-40"; // 原 w-56 → 70% 寬；摺疊更窄
  const labelVis  = collapsed ? "hidden" : "inline";
  const itemBase  = "block rounded px-3 py-2 text-sm " + (collapsed ? "text-center" : "");
  const itemCls   = ({ isActive }) =>
    itemBase +
    (isActive
      ? " bg-blue-50 text-blue-700 font-semibold"
      : " text-gray-700 hover:bg-gray-100");

  const handleLogout = () => {
    try { localStorage.removeItem("pp_auth"); localStorage.removeItem("pp_user"); } catch {}
    navigate("/login", { replace: true });
  };

  return (
    // h-screen + sticky 讓 Sidebar 固定在視窗；flex-col 讓底部區塊永遠貼底
    <aside
      className={`${widthCls} h-screen sticky top-0 shrink-0 border-r bg-white flex flex-col transition-all duration-200`}
    >
      {/* 標題 + 折疊按鈕 */}
      <div className="p-3 flex items-center justify-between">
        <div className={`text-lg font-bold truncate ${labelVis}`}>PortPilot</div>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
          className="h-7 w-7 grid place-items-center rounded-md border text-gray-600 hover:bg-gray-50"
        >
          {/* ←/→ 圖示（inline SVG） */}
          {collapsed ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 6l6 6-6 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          )}
        </button>
      </div>

      {/* 中段導覽（必要時可捲動） */}
      <nav className="space-y-1 px-2 pb-2 overflow-y-auto">
        <NavLink to="/dashboard" className={itemCls} title="Dashboard">
          <span className={labelVis}>Dashboard</span>
        </NavLink>

        <NavLink to="/my-containers" className={itemCls} title="My Containers">
          <span className={labelVis}>My Containers</span>
        </NavLink>

        {admin && (
          <>
            <div className={`mt-4 px-3 text-xs uppercase text-gray-500 ${labelVis}`}>Admin</div>
            <nav className="mt-1 flex flex-col">
              <NavLink to="/admin" className={itemCls} title="Admin Home">
                <span className={labelVis}>Admin Home</span>
              </NavLink>
              <NavLink to="/admin/users" className={itemCls} title="Users">
                <span className={labelVis}>Users</span>
              </NavLink>
              <NavLink to="/admin/drayage" className={itemCls} title="Drayage">
                <span className={labelVis}>Drayage</span>
              </NavLink>
              <NavLink to="/admin/warehouse" className={itemCls} title="Warehouse">
                <span className={labelVis}>Warehouse</span>
              </NavLink>
            </nav>
          </>
        )}
      </nav>

      {/* ── 底部：直向排列（Logout 在上、Avatar 在下），Sidebar 固定不跟右側捲動 ── */}
      <div className="mt-auto px-2 pt-2 pb-3 border-t flex flex-col items-center gap-2">
        {/* 唯一的 Logout 按鈕（請確保整個專案只出現這一顆） */}
        <button
          type="button"
          onClick={handleLogout}
          title="Logout"
          aria-label="Logout"
          className="h-9 w-9 grid place-items-center rounded-md border text-gray-600 hover:bg-gray-50"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
        </button>

        {/* Avatar（UserMenu 按鈕） */}
        <UserMenu />
      </div>

    </aside>
  );
}
