// src/components/layout/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { getCurrentUser, isAdmin } from "../../utils/auth.js";

export default function Sidebar() {
  const me = getCurrentUser();
  const admin = isAdmin(); // boolean

  const itemCls = ({ isActive }) =>
    "block rounded px-3 py-2 text-sm " +
    (isActive ? "bg-blue-50 text-blue-700 font-semibold"
              : "text-gray-700 hover:bg-gray-100");

  return (
    <aside className="w-56 shrink-0 border-r bg-white">
      <div className="p-3 text-lg font-bold">PortPilot</div>

      <nav className="space-y-1 px-2 pb-4">
        <NavLink to="/dashboard" className={itemCls}>
          Dashboard
        </NavLink>

        <NavLink to="/my-containers" className={itemCls}>
          My Containers
        </NavLink>

        {/* Admin section (visible only for Admin) */}
        {admin && (
          <>
            <div className="mt-4 px-3 text-xs uppercase text-gray-500">Admin</div>
            <nav className="mt-1 flex flex-col">
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-3 py-2 rounded ${isActive ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`
                }
              >
                Admin Home
              </NavLink>
              <NavLink
                to="/admin/users"
                className={({ isActive }) =>
                  `px-3 py-2 rounded ${isActive ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`
                }
              >
                Users
              </NavLink>
              <NavLink
                to="/admin/drayage"
                className={({ isActive }) =>
                  `px-3 py-2 rounded ${isActive ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`
                }
              >
                Drayage
              </NavLink>
              <NavLink
                to="/admin/warehouse"
                className={({ isActive }) =>
                  `px-3 py-2 rounded ${isActive ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"}`
                }
              >
                Warehouse
              </NavLink>
            </nav>
          </>
        )}
      </nav>
    </aside>
  );
}
