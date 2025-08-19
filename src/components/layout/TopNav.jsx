// 中文註解：頂部導覽列，含行動版菜單鍵與 Logout
import React from "react";

export default function TopNav({ onMenu, onLogout, title = "Dashboard" }) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b h-14 flex items-center px-3 gap-2">
      {/* 行動版開啟側欄 */}
      <button
        className="md:hidden border rounded px-3 py-1.5"
        onClick={onMenu}
        aria-label="Open menu"
      >
        ☰
      </button>

      <div className="font-semibold">{title}</div>

      <div className="ml-auto">
        <button
          onClick={onLogout}
          className="rounded-md bg-gray-800 text-white px-3 py-1.5 text-sm hover:bg-black"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
