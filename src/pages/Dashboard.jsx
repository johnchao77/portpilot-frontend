// 中文註解：整體版型（Sidebar + TopNav + Main）與暫時卡片
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import TopNav from "../components/layout/TopNav";

export default function Dashboard() {
  const [open, setOpen] = useState(false); // 行動版側欄開關
  const navigate = useNavigate();

  // 登出：清除登入狀態並回登入頁（英文訊息由後續 UI 再補）
  const handleLogout = () => {
    localStorage.removeItem("pp_auth");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 側欄 */}
      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* 右側內容：md 以上預留 64 寬給側欄 */}
      <div className="md:pl-64">
        <TopNav onMenu={() => setOpen(true)} onLogout={handleLogout} title="Dashboard" />

        {/* 主內容區 */}
        <main className="p-4">
          {/* 先放三個占位卡片，之後接 mock data / API */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card title="Containers Inbound (Mock)" value="—" />
            <Card title="Appointments Today (Mock)" value="—" />
            <Card title="Exceptions (Mock)" value="—" />
          </div>

          {/* 下面可放表格/圖表占位 */}
          <div className="mt-6 rounded-xl bg-white shadow p-4">
            <div className="font-semibold mb-2">Recent Activities (Mock)</div>
            <p className="text-sm text-gray-600">
              This is a placeholder. We will hook mock data first, then real API.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="rounded-xl bg-white shadow p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
