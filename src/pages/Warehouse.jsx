// src/pages/Warehouse.jsx
import React from "react";
import ConfirmModal from "../components/ConfirmModal";

const API_BASE = process.env.REACT_APP_API_URL || "https://api.portpilot.co";
const API_PATH = "/warehouses";

// 產生穩定列 id（做勾選/刪除的 key）
const genId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const ensureIds = (arr = []) => arr.map(r => (r && r._id ? r : { _id: genId(), ...r }));

const COLUMNS = [
  { key: "whse_code", label: "WHSE Code*", width: 200, required: true },
  { key: "whse_name", label: "WHSE Name", width: 260 },
  { key: "address", label: "Address", width: 420 },
];

export default function Warehouse() {
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  // 勾選/刪除
  const [selectedIds, setSelectedIds] = React.useState(new Set());
  const [isDeleteOpen, setDeleteOpen] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const r = await fetch(`${API_BASE}${API_PATH}`);
        const j = await r.json();
        if (!r.ok || !j.ok) throw new Error(j.error || "load failed");
        setRows(ensureIds(j.rows || []));
      } catch (e) {
        console.error(e);
        setErr("Load failed.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onAddRow = () => {
    setRows(rs => [{ _id: genId(), whse_code: "", whse_name: "", address: "" }, ...rs]);
  };

  const toggleSelect = (rowId, checked) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(rowId);
      else next.delete(rowId);
      return next;
    });
  };

  const askDelete = () => {
    if (selectedIds.size === 0) return;
    setDeleteOpen(true);
  };
  const confirmDelete = () => {
    setRows(prev => prev.filter(r => !selectedIds.has(r._id)));
    setSelectedIds(new Set());
    setDeleteOpen(false);
  };

  const onCellChange = (idx, key, v) => {
    setRows(rs => {
      const copy = [...rs];
      copy[idx] = { ...copy[idx], [key]: v };
      return copy;
    });
  };

  // 大小寫不敏感的重複檢查
  const dupCodeSet = React.useMemo(() => {
    const map = new Map(); // lower_code -> count
    for (const r of rows) {
      const code = (r.whse_code || "").trim().toLowerCase();
      if (!code) continue;
      map.set(code, (map.get(code) || 0) + 1);
    }
    return new Set([...map.entries()].filter(([, c]) => c > 1).map(([k]) => k));
  }, [rows]);

  const onSave = async () => {
    setErr("");

    // 前端阻擋：必填 & 唯一性
    for (const r of rows) {
      if ((r.whse_code || "").trim() === "") {
        setErr("WHSE Code is required.");
        return;
      }
    }
    if (dupCodeSet.size > 0) {
      setErr("Duplicate WHSE Code is not allowed.");
      return;
    }

    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}${API_PATH}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "save failed");
    } catch (e) {
      console.error(e);
      setErr(e.message || "Save failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <h1 className="text-xl font-bold">Warehouse</h1>
        <button className="px-3 py-1 rounded bg-gray-100 border" onClick={onAddRow}>
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
          type="button"
          onClick={askDelete}
          disabled={selectedIds.size === 0}
          className={
            selectedIds.size === 0
              ? "px-3 py-1 rounded bg-gray-200 text-gray-500 cursor-not-allowed"
              : "px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
          }
          title={selectedIds.size ? `Delete ${selectedIds.size} selected row(s)` : "Select rows to enable"}
        >
          Delete
        </button>
        {err && <span className="text-red-600 ml-2">{err}</span>}
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th style={{ width: 36, minWidth: 36 }} className="sticky top-0 bg-white border-b px-2 py-2">
                &nbsp;
              </th>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  className="sticky top-0 bg-white border-b px-2 py-2 text-left text-sm font-semibold"
                  style={{ width: col.width, minWidth: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="text-center text-gray-500 py-8">
                  No data.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const codeLower = (row.whse_code || "").trim().toLowerCase();
                const isDup = !!codeLower && dupCodeSet.has(codeLower);
                return (
                  <tr key={row._id} className="border-t">
                    {/* 勾選欄 */}
                    <td style={{ width: 36, minWidth: 36 }} className="px-2 py-1 align-top">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row._id)}
                        onChange={(e) => toggleSelect(row._id, e.target.checked)}
                      />
                    </td>

                    {/* WHSE Code */}
                    <td className="px-2 py-1 align-top" style={{ width: COLUMNS[0].width }}>
                      <input
                        className={`w-full border rounded px-2 py-1 text-sm ${isDup ? "border-red-500" : ""}`}
                        placeholder="e.g. WHS-01"
                        value={row.whse_code || ""}
                        onChange={(e) => onCellChange(idx, "whse_code", e.target.value)}
                        title={isDup ? "Duplicate code" : ""}
                      />
                    </td>

                    {/* WHSE Name */}
                    <td className="px-2 py-1 align-top" style={{ width: COLUMNS[1].width }}>
                      <input
                        className="w-full border rounded px-2 py-1 text-sm"
                        placeholder="Company name"
                        value={row.whse_name || ""}
                        onChange={(e) => onCellChange(idx, "whse_name", e.target.value)}
                      />
                    </td>

                    {/* Address */}
                    <td className="px-2 py-1 align-top" style={{ width: COLUMNS[2].width }}>
                      <input
                        className="w-full border rounded px-2 py-1 text-sm"
                        placeholder="Street, City, State"
                        value={row.address || ""}
                        onChange={(e) => onCellChange(idx, "address", e.target.value)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={isDeleteOpen}
        title="Remove selected rows"
        message={`You’re about to remove ${selectedIds.size} selected ${selectedIds.size === 1 ? "row" : "rows"}.\n\nNote: They won’t be permanently deleted until you click “Save”.`}
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
