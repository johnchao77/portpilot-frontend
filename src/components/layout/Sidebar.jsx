// 中文註解：左側導覽欄，行動版可抽屜開關；電腦版固定 64 寬
import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* 側欄本體 */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-md transition-transform duration-200
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static`}
      >
        <div className="p-4 text-xl font-bold">PortPilot</div>
        <nav className="px-2 space-y-1">
          <Item to="/dashboard" label="Overview" />
          <Item to="/drayage" label="Drayage" />
          <Item to="/appointments" label="Appointments" />
          <Item to="/reports" label="Reports" />
        </nav>
      </aside>

      {/* 行動版遮罩點擊關閉 */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    </>
  );
}

function Item({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block rounded-md px-3 py-2 text-sm ${
          isActive
            ? "bg-blue-50 text-blue-700"
            : "text-gray-700 hover:bg-gray-50"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
