// src/pages/Drayage.jsx
import React, { useEffect, useMemo, useState } from "react";
import ConfirmModal from "../components/ConfirmModal";

const API_BASE = process.env.REACT_APP_API_URL || "https://api.portpilot.co";

// 產生穩定列 id（用於勾選/刪除）
const genId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const ensureIds = (arr = []) =>
  arr.map((r) => (r && r._id ? r : { _id: genId(), ...r }));

const COLUMNS = [
  { key: "code", label: "Drayage Code*", width: 220 },
  { key: "name", label: "Drayage Name", width: 320, placeholder: "Company name" },
  { key: "address", label: "Address", width: 420, placeholder: "Street, City, State" },
];

export default function Drayage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [isDeleteOpen, setDeleteOpen] = useState(false);

  // 載入
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const r = await fetch(`${API_BASE}/drayage`);
        const j = await r.json();
        if (!r.ok || !j.ok) throw new Error(j.error || "Load failed");
        setRows(ensureIds(j.rows || []));
      } catch (e) {
        console.error(e);
        setErr("Failed to load drayage list.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 新增列
  const onAdd = () =>
    setRows((prev) => [{ _id: genId(), code: "", name: "", address: "" }, ...prev]);

  // 編輯
  const onChange = (idx, key, value) =>
    setRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [key]: value };
      return copy;
    });

  // 勾選
  const toggleSelect = (id, checked) =>
    setSelected((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });

  // 刪除（打開 modal）
  const askDelete = () => {
    if (selected.size === 0) return;
    setDeleteOpen(true);
  };

  // 確認刪除
  const confirmDelete = () => {
    setRows((prev) => prev.filter((r) => !selected.has(r._id)));
    setSelected(new Set());
    setDeleteOpen(false);
  };

  // 儲存（後端已做唯一性檢查，但前端也先擋一次）
  const onSave = async () => {
    setLoading(true);
    setErr("");
    try {
      // 前端唯一性驗證（大小寫不敏感）
      const seen = new Set();
      const dup = new Set();
      for (const r of rows) {
        const code = String(r.code || "").trim();
        if (!code) {
          setErr("Drayage Code is required.");
          setLoading(false);
          return;
        }
        const key = code.toLowerCase();
        if (seen.has(key)) dup.add(code);
        seen.add(key);
      }
      if (dup.size > 0) {
        setErr(`Duplicate Drayage Code: ${[...dup].join(", ")}`);
        setLoading(false);
        return;
      }

      const payload = {
        rows: rows.map((r) => ({
          code: (r.code || "").trim(),
          name: r.name || "",
          address: r.address || "",
        })),
      };

      const resp = await fetch(`${API_BASE}/drayage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await resp.json().catch(() => ({}));
      if (!resp.ok || !j.ok) throw new Error(j.error || "Save failed");
    } catch (e) {
      console.error(e);
      setErr(e.message || "Save failed.");
    } finally {
      setLoading(false);
    }
  };

  const anySelected = selected.size > 0;

  const tableRows = useMemo(() => rows, [rows]);

  return (
    <div className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <h1 className="text-xl font-bold">Drayage</h1>
        <button className="px-3 py-1 rounded bg-gray-100 border" onClick={onAdd}>
          + Add Row
        </button>
        <button
          className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
          onClick={onSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
        <button
          className={
            anySelected
              ? "px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              : "px-3 py-1 rounded bg-gray-200 text-gray-500 cursor-not-allowed"
          }
          onClick={askDelete}
          disabled={!anySelected}
        >
          Delete
        </button>
        {err && <span className="ml-3 text-red-600">{err}</span>}
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th style={{ width: 36, minWidth: 36 }} className="sticky top-0 bg-white border-b px-2 py-2">
                &nbsp;
              </th>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className="sticky top-0 bg-white border-b px-2 py-2 text-left text-sm font-semibold"
                  style={{ minWidth: c.width }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="text-center text-gray-500 py-8">
                  No data.
                </td>
              </tr>
            ) : (
              tableRows.map((r, idx) => (
                <tr key={r._id} className="border-t">
                  <td style={{ width: 36 }} className="px-2 py-1 align-top">
                    <input
                      type="checkbox"
                      checked={selected.has(r._id)}
                      onChange={(e) => toggleSelect(r._id, e.target.checked)}
                    />
                  </td>
                  {COLUMNS.map((c) => (
                    <td key={c.key} className="px-2 py-1 align-top">
                      <input
                        className="w-full border rounded px-2 py-1 text-sm"
                        placeholder={c.placeholder || ""}
                        value={r[c.key] ?? ""}
                        onChange={(e) => onChange(idx, c.key, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={isDeleteOpen}
        title="Remove selected rows"
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
