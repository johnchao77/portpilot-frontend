// src/pages/AdminHome.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function AdminHome() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Admin Home</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card to="/admin/users" title="Users" desc="Manage user accounts, roles, and access." />
        <Card to="/admin/drayage" title="Drayage" desc="Maintain drayage master codes." />
        <Card to="/admin/warehouse" title="Warehouse" desc="Maintain warehouse master codes." />
      </div>
    </div>
  );
}

function Card({ to, title, desc }) {
  return (
    <Link
      to={to}
      className="block rounded-lg border bg-white p-4 hover:shadow-md transition"
    >
      <div className="text-lg font-semibold">{title}</div>
      <div className="text-sm text-gray-600 mt-1">{desc}</div>
    </Link>
  );
}
