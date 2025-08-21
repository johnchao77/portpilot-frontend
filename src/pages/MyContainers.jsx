// src/pages/MyContainers.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  toDisplayDate,
  toDisplayDateTime,
  normalizeDateInput,
} from "../utils/dateFormatters";

const API_BASE = process.env.REACT_APP_API_URL || "https://api.portpilot.co";

// 欄位定義（完全比照 Excel）
const COLUMNS = [
  { key: "order_no", label: "Order No", width: 180 },
  { key: "status", label: "Status", width: 110 },
  { key: "drayage", label: "Drayage", width: 110 },
  { key: "warehouse", label: "Warehouse", width: 110 },
  { key: "mbl_no", label: "MBL No", width: 150 },
  { key: "container", label: "Container No", width: 140 },
  { key: "etd", label: "ETD", width: 110, type: "date" },
  { key: "eta", label: "ETA", width: 110, type: "date" },
  { key: "pod", label: "POD", width: 150 },
  { key: "arrived", label: "Arrived", width: 110, type: "date" },
  { key: "lfd", label: "LFD", width: 110, type: "date" },
  { key: "appt_date", label: "Appt Date", width: 130, type: "date" },
  { key: "lrd", label: "LRD", width: 110, type: "date" },
  { key: "delivered_dt", label: "Delivered DateTime", width: 180, type: "datetime" },
  { key: "emptied_dt", label: "Emptied DateTime", width: 170, type: "datetime" },
  { key: "returned_date", label: "Returned Date", width: 130, type: "date" },
];

const DATE_FIELDS = new Set(
  COLUMNS.filter(c => c.type === "date").map(c => c.key)
);
const DATETIME_FIELDS = new Set(
  COLUMNS.filter(c => c.type === "datetime").map(c => c.key)
);

const WIDTHS_KEY = "mycontainers.colwidths";

export default function MyContainers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [sortDir, setSortDir] = useState(0); // 0: none, 1: asc, -1: desc
  const [widths, setWidths] = useState(() => {
    const saved = localStorage.getItem(WIDTHS_KEY);
    if (saved) return JSON.parse(saved);
    const w = {};
    COLUMNS.forEach(c => (w[c.key] = c.width || 120));
    return w;
  });

  useEffect(() => {
    localStorage.setItem(WIDTHS_KEY, JSON.stringify(widths));
  }, [widths]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const r = await fetch(`${API_BASE}/my-containers`);
        const j = await r.json();
        if (!r.ok || !j.ok) throw new Error(j.error || "load failed");
        setRows(j.rows || []);
      } catch (e) {
        console.error(e);
        setErr("Load failed.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onAddRow = () => {
    setRows(r => [{}, ...r]);
  };

  const onCellChange = (idx, key, v) => {
    setRows(r => {
      const copy = [...r];
      copy[idx] = { ...copy[idx], [key]: v };
      return copy;
    });
  };

  // 失焦時做正規化（日期自動補年份）
  const onCellBlur = (idx, key) => {
    setRows(r => {
      const copy = [...r];
      const val = copy[idx]?.[key];
      if (val == null) return copy;

      if (DATE_FIELDS.has(key)) {
        const iso = normalizeDateInput(val, false);
        copy[idx][key] = iso || "";
      } else if (DATETIME_FIELDS.has(key)) {
        const iso = normalizeDateInput(val, true);
        copy[idx][key] = iso || "";
      }
      return copy;
    });
  };

  const onSave = async () => {
    setLoading(true);
    setErr("");
    try {
      const r = await fetch(`${API_BASE}/my-containers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "save failed");
    } catch (e) {
      console.error(e);
      setErr("Save failed.");
    } finally {
      setLoading(false);
    }
  };

  const onExport = () => {
    const aoa = [
      COLUMNS.map(c => c.label),
      ...rows.map(r =>
        COLUMNS.map(c => formatForDisplay(r[c.key], c))
      ),
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, "MyContainers");
    XLSX.writeFile(wb, "MyContainers.xlsx");
  };

  // 排序
  const sorted = useMemo(() => {
    if (sortDir === 0 || !sortKey) return rows;
    const isDate = DATE_FIELDS.has(sortKey);
    const isDateTime = DATETIME_FIELDS.has(sortKey);
    const copy = [...rows];
    copy.sort((a, b) => {
      const va = a?.[sortKey] ?? "";
      const vb = b?.[sortKey] ?? "";
      if (isDate || isDateTime) {
        const da = va ? new Date(va).getTime() : 0;
        const db = vb ? new Date(vb).getTime() : 0;
        return sortDir * (da - db);
      }
      // string / number 混合，皆用字串比較以簡化
      return sortDir * String(va).localeCompare(String(vb));
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  // 欄寬拖拉
  const dragRef = useRef({ col: "", startX: 0, startW: 0 });
  const onDragStart = (e, colKey) => {
    dragRef.current = { col: colKey, startX: e.clientX, startW: widths[colKey] || 120 };
    window.addEventListener("mousemove", onDragging);
    window.addEventListener("mouseup", onDragEnd);
    e.preventDefault();
  };
  const onDragging = (e) => {
    const { col, startX, startW } = dragRef.current;
    if (!col) return;
    const dx = e.clientX - startX;
    const newW = Math.max(60, startW + dx);
    setWidths(w => ({ ...w, [col]: newW }));
  };
  const onDragEnd = () => {
    dragRef.current = { col: "", startX: 0, startW: 0 };
    window.removeEventListener("mousemove", onDragging);
    window.removeEventListener("mouseup", onDragEnd);
  };

  const toggleSort = (key) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir(1);
    } else {
      setSortDir(d => (d === 1 ? -1 : d === -1 ? 0 : 1));
    }
  };

  return (
    <div className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <h1 className="text-xl font-bold">My Containers</h1>
        <button className="px-3 py-1 rounded bg-gray-100 border" onClick={onAddRow}>
          + Add Row
        </button>
        <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={onSave} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
        <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={onExport}>
          Export Excel
        </button>
        {err && <span className="text-red-600 ml-2">{err}</span>}
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              {COLUMNS.map(col => (
                <th key={col.key}
                    style={{ width: widths[col.key], minWidth: widths[col.key] }}
                    className="sticky top-0 bg-white border-b px-2 py-2 text-left text-sm font-semibold relative select-none">
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleSort(col.key)} className="text-left">
                      {col.label}{sortKey === col.key ? (sortDir === 1 ? " ▲" : sortDir === -1 ? " ▼" : "") : ""}
                    </button>
                    <span
                      onMouseDown={(e) => onDragStart(e, col.key)}
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize"
                      style={{ userSelect: "none" }}
                      title="Drag to resize"
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="text-center text-gray-500 py-8">
                  No data.
                </td>
              </tr>
            ) : sorted.map((row, idx) => (
              <tr key={idx} className="border-t">
                {COLUMNS.map(col => (
                  <td key={col.key} style={{ width: widths[col.key], minWidth: widths[col.key] }} className="px-2 py-1 align-top">
                    <Cell
                      value={row[col.key]}
                      col={col}
                      onChange={(v) => onCellChange(idx, col.key, v)}
                      onBlur={() => onCellBlur(idx, col.key)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Cell({ value, col, onChange, onBlur }) {
  const display = formatForDisplay(value, col);
  const [v, setV] = useState(display);

  useEffect(() => {
    setV(display);
  }, [display]);

  return (
    <input
      className="w-full border rounded px-2 py-1 text-sm"
      value={v ?? ""}
      onChange={(e) => {
        setV(e.target.value);
        onChange(e.target.value);
      }}
      onBlur={onBlur}
      placeholder={col.type === "datetime" ? "mm/dd/yy hh:mm am/pm" :
                   col.type === "date" ? "mm/dd/yy" : ""}
    />
  );
}

function formatForDisplay(val, col) {
  if (!val) return "";
  if (col.type === "date") return toDisplayDate(val);
  if (col.type === "datetime") return toDisplayDateTime(val);
  return String(val);
}
