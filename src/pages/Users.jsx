// src/pages/Users.jsx
import React, { useEffect, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";

const API_BASE = process.env.REACT_APP_API_URL || "https://api.portpilot.co";
const ROLES = ["Admin", "Dispatcher", "Drayage", "Warehouse"];

// 讀目前登入者（由 PortPilotLoginPage 寫入的 pp_user）
function getCurrentUser() {
  try {
    const u = JSON.parse(localStorage.getItem("pp_user") || "null");
    return u && u.email ? u : null;
  } catch {
    return null;
  }
}

// 單純產生前端使用的列 key（不送後端）
const genId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export default function UsersPage() {
  const me = getCurrentUser();
  const isAdmin = me?.role === "Admin";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [myNewPw, setMyNewPw] = useState("");

  // 刪除確認 Modal
  const [deleteOpen, setDeleteOpen] = useState(false);

  // 供後端判斷的簡單 header（你後端 app.py 會讀這兩個）
  const authHeaders = me
    ? { "X-User-Email": me.email, "X-User-Role": me.role || "" }
    : {};

  // 初次載入
  useEffect(() => {
    if (!me) return;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const r = await fetch(`${API_BASE}/users`, { headers: authHeaders });
        const j = await r.json();
        if (!r.ok || !j.ok) throw new Error(j.error || "Load failed");
        // Admin 可能多筆，非 Admin 只會回自己一筆；密碼欄位一律清空
        setRows((j.rows || []).map((x) => ({ _id: genId(), ...x, password: "" })));
      } catch (e) {
        console.error(e);
        setErr("Load failed.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); //（固定初次載入即可）

  if (!me) return <div className="p-4">Not signed in.</div>;

  // ───────── Admin 專用：新增、刪除、儲存 ─────────
  const onAdd = () => {
    if (!isAdmin) return;
    setRows((r) => [
      {
        _id: genId(),
        email: "",
        password: "",
        name: "",
        company: "",
        company_code: "",
        role: "Dispatcher",
        remark: "",
      },
      ...r,
    ]);
  };

  const onToggleSel = (id, checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const askDelete = () => {
    if (!isAdmin || selected.size === 0) return;
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    setRows((prev) => prev.filter((r) => !selected.has(r._id)));
    setSelected(new Set());
    setDeleteOpen(false);
  };

  const onChange = (idx, key, val) => {
    setRows((r) => {
      const copy = [...r];
      copy[idx] = { ...copy[idx], [key]: val };
      return copy;
    });
  };

  // 儲存前驗證（Admin 批次）
  const validate = () => {
    if (!isAdmin) return true;
    const seen = new Set();
    for (const r of rows) {
      const email = (r.email || "").trim().toLowerCase();
      const role = (r.role || "").trim();
      if (!email) return "Email is required.";
      if (!ROLES.includes(role)) return `Invalid role for ${email}`;
      if (seen.has(email)) return `Duplicate email: ${email}`;
      seen.add(email);
    }
    return true;
  };

  const onSave = async () => {
    if (!isAdmin) return;
    const v = validate();
    if (v !== true) {
      setErr(v);
      return;
    }
    setLoading(true);
    setErr("");
    try {
      // 只把需要的欄位送回去；password 若為空字串後端會忽略（不改密碼）
      const payload = {
        rows: rows.map((r) => ({
          email: (r.email || "").trim().toLowerCase(),
          password: (r.password || "").trim(),
          name: r.name || "",
          company: r.company || "",
          company_code: r.company_code || "",
          role: r.role || "",
          remark: r.remark || "",
        })),
      };
      const r = await fetch(`${API_BASE}/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "Save failed");

      // 重新拉一次，把密碼欄清空
      const r2 = await fetch(`${API_BASE}/users`, { headers: authHeaders });
      const j2 = await r2.json();
      setRows((j2.rows || []).map((x) => ({ _id: genId(), ...x, password: "" })));
    } catch (e) {
      console.error(e);
      setErr(e.message || "Save failed.");
    } finally {
      setLoading(false);
    }
  };

  // ───────── 非 Admin：改自己的密碼 ─────────
  const changeMyPassword = async () => {
    if (myNewPw.trim().length < 4) {
      setErr("Password too short.");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const r = await fetch(`${API_BASE}/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ password: myNewPw.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "Change password failed");
      setMyNewPw("");
      alert("Password changed.");
    } catch (e) {
      console.error(e);
      setErr(e.message || "Change password failed.");
    } finally {
      setLoading(false);
    }
  };

  // =============== Admin 介面（表格） ===============
  if (isAdmin) {
    return (
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <h1 className="text-xl font-bold">Users</h1>
          <button className="px-3 py-1 rounded bg-gray-100 border" onClick={onAdd}>
            + Add Row
          </button>
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white"
            onClick={onSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            onClick={askDelete}
            disabled={selected.size === 0}
            className={
              selected.size === 0
                ? "px-3 py-1 rounded bg-gray-200 text-gray-500 cursor-not-allowed"
                : "px-3 py-1 rounded bg-red-600 text-white"
            }
          >
            Delete
          </button>
          {err && <span className="text-red-600 ml-2">{err}</span>}
        </div>

        <div className="overflow-auto border rounded">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-white sticky top-0">
                <th className="px-2 py-2" style={{ width: 36 }}></th>
                <th className="px-2 py-2 text-left">Email*</th>
                <th className="px-2 py-2 text-left">Password (set to change)</th>
                <th className="px-2 py-2 text-left">Name</th>
                <th className="px-2 py-2 text-left">Company</th>
                <th className="px-2 py-2 text-left">Company Code</th>
                <th className="px-2 py-2 text-left">Role*</th>
                <th className="px-2 py-2 text-left">Remark</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-gray-500 py-8">
                    No data.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r._id} className="border-t">
                    <td className="px-2 py-1">
                      <input
                        type="checkbox"
                        checked={selected.has(r._id)}
                        onChange={(e) => onToggleSel(r._id, e.target.checked)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={r.email || ""}
                        onChange={(e) => onChange(i, "email", e.target.value)}
                        placeholder="user@example.com"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-full border rounded px-2 py-1 text-sm"
                        type="password"
                        value={r.password || ""}
                        onChange={(e) => onChange(i, "password", e.target.value)}
                        placeholder="(leave blank to keep)"
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={r.name || ""}
                        onChange={(e) => onChange(i, "name", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={r.company || ""}
                        onChange={(e) => onChange(i, "company", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={r.company_code || ""}
                        onChange={(e) => onChange(i, "company_code", e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <select
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={r.role || ""}
                        onChange={(e) => onChange(i, "role", e.target.value)}
                      >
                        {ROLES.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={r.remark || ""}
                        onChange={(e) => onChange(i, "remark", e.target.value)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 刪除確認 Modal */}
        <ConfirmModal
          open={deleteOpen}
          title="Remove selected users"
          message={`You’re about to remove ${selected.size} selected ${
            selected.size === 1 ? "row" : "rows"
          }.\n\nNote: They won’t be permanently deleted until you click “Save”.`}
          confirmText="Remove"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      </div>
    );
  }

  // =============== 非 Admin 介面（僅看自己的資料 + 改密碼） ===============
  const mine = rows[0] || {};
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-3">My Profile</h1>
      {err && <div className="text-red-600 mb-2">{err}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
        <Readonly label="Email" value={mine.email} />
        <Readonly label="Role" value={mine.role} />
        <Readonly label="Name" value={mine.name} />
        <Readonly label="Company" value={mine.company} />
        <Readonly label="Company Code" value={mine.company_code} />
        <Readonly label="Remark" value={mine.remark} />
      </div>

      <div className="mt-6 max-w-md border rounded p-4">
        <div className="font-semibold mb-2">Change Password</div>
        <input
          type="password"
          className="w-full border rounded px-2 py-2 text-sm"
          value={myNewPw}
          onChange={(e) => setMyNewPw(e.target.value)}
          placeholder="New password"
        />
        <div className="mt-3">
          <button
            className="px-3 py-1 rounded bg-blue-600 text-white"
            onClick={changeMyPassword}
            disabled={loading}
          >
            {loading ? "Saving..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Readonly({ label, value }) {
  return (
    <label className="text-sm">
      <div className="text-gray-600 mb-1">{label}</div>
      <div className="border rounded px-2 py-2 bg-gray-50">
        {value || <span className="text-gray-400">—</span>}
      </div>
    </label>
  );
}
