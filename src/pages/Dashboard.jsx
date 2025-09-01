// src/pages/Dashboard.jsx
import React from "react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* 三個占位卡片，之後接 mock data / API */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Containers Inbound (Mock)" value="—" />
        <Card title="Appointments Today (Mock)" value="—" />
        <Card title="Exceptions (Mock)" value="—" />
      </div>

      {/* 下面可放表格/圖表占位 */}
      <div className="rounded-xl bg-white shadow p-4">
        <div className="font-semibold mb-2">Recent Activities (Mock)</div>
        <p className="text-sm text-gray-600">
          This is a placeholder. We will hook mock data first, then real API.
        </p>
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
