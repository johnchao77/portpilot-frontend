// src/pages/Users.jsx
import React, { useEffect, useState } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "https://api.portpilot.co";
const ROLES = ["Admin", "Dispatcher", "Drayage", "Warehouse"];

function getCurrentUser() {
  try {
    const a = JSON.parse(localStorage.getItem("pp_user") || "null");
    if (a && a.email) return a;
    const b = JSON.parse(localStorage.getItem("user") || "null");
    return b || null;
  } catch {
    return null;
  }
}

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

  // option lists for Company Code
  const [drayageCodes, setDrayageCodes] = useState([]);
  const [whseCodes, setWhseCodes] = useState([]);

  const hdrs = me
    ? { "X-User-Email": me.email, "X-User-Role": me.role || "" }
    : {};

  // load users
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const r = await fetch(`${API_BASE}/users`, { headers: hdrs });
        const j = await r.json();
        if (!r.ok || !j.ok) throw new Error(j.error || "load failed");
        setRows((j.rows || []).map((x) => ({ _id: genId(), ...x, password: "" })));
      } catch (e) {
        console.error(e);
        setErr("Load failed.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load dropdown sources (drayage/warehouse codes)
  useEffect(() => {
    (async () => {
      try {
        const [r1, r2] = await Promise.all([
          fetch(`${API_BASE}/drayage`),
          fetch(`${API_BASE}/warehouse`),
        ]);
        const j1 = await r1.json().catch(() => ({}));
        const j2 = await r2.json().catch(() => ({}));
        setDrayageCodes(
          (j1.rows || [])
            .map((x) => (x.code || "").trim())
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))
        );
        setWhseCodes(
          (j2.rows || [])
            .map((x) => (x.whse_code || "").trim())
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))
        );
      } catch (e) {
        // 靜默失敗：頁面仍可輸入文字
        console.warn("load dropdown sources failed", e);
      }
    })();
  }, []);

  if (!me) {
    return <div className="p-4">Not signed in.</div>;
  }

  const onAdd = () => {
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

  const onToggleSel = (id, v) => {
    setSelected((prev) => {
      const next = new Set(prev);
      v ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const onDelete = () => {
    if (selected.size === 0) return;
    if (
      !window.confirm(
        `Delete ${selected.size} selected row(s)? (changes apply after Save)`
      )
    )
      return;
    setRows((prev) => prev.filter((r) => !selected.has(r._id)));
    setSelected(new Set());
  };

  const onChange = (idx, key, val) => {
    setRows((r) => {
      const copy = [...r];
      copy[idx] = { ...copy[idx], [key]: val };
      return copy;
    });
  };

  // when Role changes, keep company_code consistent with the right list
  const onRoleChange = (idx, newRole) => {
    setRows((r) => {
      const copy = [...r];
      const cur = { ...copy[idx], role: newRole };
      const code = (cur.company_code || "").trim();
      if (newRole === "Drayage" && !drayageCodes.includes(code)) cur.company_code = "";
      else if (newRole === "Warehouse" && !whseCodes.includes(code))
        cur.company_code = "";
      copy[idx] = cur;
      return copy;
    });
  };

  const validate = () => {
    if (!isAdmin) return true;
    const emails = new Set();
    for (const r of rows) {
      const email = (r.email || "").trim().toLowerCase();
      const role = (r.role || "").trim();
      if (!email) return "Email is required.";
      if (emails.has(email)) return `Duplicate email: ${email}`;
      if (!ROLES.includes(role)) return `Invalid role for ${email}`;

      // new: when Drayage/Warehouse, company_code must come from their list
      const code = (r.company_code || "").trim();
      if (role === "Drayage") {
        if (!code) return `Company Code is required for ${email} (Drayage).`;
        if (!drayageCodes.includes(code))
          return `Company Code must be a valid Drayage Code for ${email}.`;
      }
      if (role === "Warehouse") {
        if (!code) return `Company Code is required for ${email} (Warehouse).`;
        if (!whseCodes.includes(code))
          return `Company Code must be a valid WHSE Code for ${email}.`;
      }
      emails.add(email);
    }
    return true;
    // you can relax the validation if you prefer to allow free text and let the backend reject
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
      const payload = {
        rows: rows.map((r) => ({
          email: (r.email || "").trim().toLowerCase(),
          password: (r.password || "").trim(), // blank => keep
          name: r.name || "",
          company: r.company || "",
          company_code: (r.company_code || "").trim(),
          role: r.role || "",
          remark: r.remark || "",
        })),
      };
      const r = await fetch(`${API_BASE}/users`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...hdrs },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "save failed");
      // reload (and clear password inputs)
      const r2 = await fetch(`${API_BASE}/users`, { headers: hdrs });
      const j2 = await r2.json();
      setRows((j2.rows || []).map((x) => ({ _id: genId(), ...x, password: "" })));
    } catch (e) {
      console.error(e);
      setErr(e.message || "Save failed.");
    } finally {
      setLoading(false);
    }
  };

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
        headers: { "Content-Type": "application/json", ...hdrs },
        body: JSON.stringify({ password: myNewPw.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "change password failed");
      setMyNewPw("");
      alert("Password changed.");
    } catch (e) {
      console.error(e);
      setErr(e.message || "Change password failed.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Admin UI ----------
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
            className={
              selected.size
                ? "px-3 py-1 rounded bg-red-600 text-white"
                : "px-3 py-1 rounded bg-gray-200 text-gray-500 cursor-not-allowed"
            }
            disabled={!selected.size}
            onClick={onDelete}
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
                {/* Role moved to the first column */}
                <th className="px-2 py-2 text-left">Role*</th>
                <th className="px-2 py-2 text-left">Email*</th>
                <th className="px-2 py-2 text-left">Password (set to change)</th>
                <th className="px-2 py-2 text-left">Name</th>
                <th className="px-2 py-2 text-left">Company</th>
                <th className="px-2 py-2 text-left">Company Code</th>
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

                    {/* Role first */}
                    <td className="px-2 py-1">
                      <select
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={r.role || ""}
                        onChange={(e) => onRoleChange(i, e.target.value)}
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

                    {/* Company Code: dropdown for Drayage/Warehouse */}
                    <td className="px-2 py-1">
                      {r.role === "Drayage" ? (
                        <select
                          className="w-full border rounded px-2 py-1 text-sm"
                          value={r.company_code || ""}
                          onChange={(e) => onChange(i, "company_code", e.target.value)}
                        >
                          <option value="">-- Select Drayage Code --</option>
                          {drayageCodes.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      ) : r.role === "Warehouse" ? (
                        <select
                          className="w-full border rounded px-2 py-1 text-sm"
                          value={r.company_code || ""}
                          onChange={(e) => onChange(i, "company_code", e.target.value)}
                        >
                          <option value="">-- Select WHSE Code --</option>
                          {whseCodes.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="w-full border rounded px-2 py-1 text-sm"
                          value={r.company_code || ""}
                          onChange={(e) => onChange(i, "company_code", e.target.value)}
                          placeholder="Company Code"
                        />
                      )}
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
      </div>
    );
  }

  // ---------- Non-admin: read-only + change password ----------
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
