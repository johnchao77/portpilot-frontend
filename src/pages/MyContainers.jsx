// src/pages/MyContainers.jsx
import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  DATE_FIELDS, DATETIME_FIELDS,
  toDisplayDate, toDisplayDateTime,
  toISODate, toISODateTime
} from "../utils/dataFormatters";

const API_BASE = process.env.REACT_APP_API_URL || "https://api.portpilot.co";

const COLUMNS = [
  // 依你的實際欄位調整；未來要增刪欄位只改這裡
  "BOL","SO","Container","SCAC","Truck #","Plate #",
  "ETD","ETA","Arrived","LFD","Appt Date","LRD","Returned Date",
  "Delivered DateTime","Emptied DateTime",
  "Terminal","Steamship Line","Consignee","Notes"
];

const display = (key, val) => {
  if (DATE_FIELDS.includes(key)) return toDisplayDate(val);
  if (DATETIME_FIELDS.includes(key)) return toDisplayDateTime(val);
  return val ?? "";
};

const normalizeForSave = (row) => {
  const out = { ...row };
  DATE_FIELDS.forEach(k => { if (k in out) out[k] = toISODate(out[k]); });
  DATETIME_FIELDS.forEach(k => { if (k in out) out[k] = toISODateTime(out[k]); });
  return out;
};

export default function MyContainers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 初次載入：從雲端 DB 取資料
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(`${API_BASE}/MyContainers`);
        const j = await r.json();
        if (j?.ok) setRows(j.rows || []);
        else setError(j?.error || "Load failed");
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onCellChange = (ri, key, val) => {
    setRows(prev => {
      const copy = [...prev];
      const row = { ...copy[ri] };
      // blur 時再格式化；輸入時先暫存原值
      row[key] = val;
      copy[ri] = row;
      return copy;
    });
  };

  const onCellBlur = (ri, key, val) => {
    setRows(prev => {
      const copy = [...prev];
      const row = { ...copy[ri] };
      if (DATE_FIELDS.includes(key)) row[key] = toDisplayDate(val);
      else if (DATETIME_FIELDS.includes(key)) row[key] = toDisplayDateTime(val);
      copy[ri] = row;
      return copy;
    });
  };

  const addRow = () => setRows(prev => [...prev, Object.fromEntries(COLUMNS.map(c => [c, ""]))]);
  const delRow = (ri) => setRows(prev => prev.filter((_, i) => i !== ri));

  const saveAll = async () => {
    try {
      setSaving(true);
      setError("");
      const payload = { rows: rows.map(normalizeForSave) };
      const r = await fetch(`${API_BASE}/MyContainers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || "Save failed");
      // 後端存的是 ISO；重新拉一次轉顯示
      const rr = await fetch(`${API_BASE}/MyContainers`);
      const jj = await rr.json();
      if (jj?.ok) setRows(jj.rows || []);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const exportExcel = () => {
    // 匯出時用當前顯示值
    const data = rows.map(r => {
      const obj = {};
      COLUMNS.forEach(k => obj[k] = display(k, r[k]));
      return obj;
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "MyContainers");
    XLSX.writeFile(wb, "MyContainers.xlsx");
  };

  const header = useMemo(() => COLUMNS, []);

  if (loading) return <div className="p-6">Loading…</div>;
  return (
    <div className="p-6 space-y-3">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">My Containers</h1>
        <button onClick={addRow} className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200">+ Add Row</button>
        <button onClick={saveAll} disabled={saving} className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
        <button onClick={exportExcel} className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700">Export Excel</button>
        {error && <span className="text-red-600 text-sm ml-2">{error}</span>}
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-[900px] w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="border px-2 py-1 w-12">#</th>
              {header.map(h => (
                <th key={h} className="border px-2 py-1 text-left">{h}</th>
              ))}
              <th className="border px-2 py-1 w-16">Del</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className="odd:bg-white even:bg-gray-50">
                <td className="border px-2 py-1 text-center">{ri + 1}</td>
                {header.map(k => (
                  <td key={k} className="border px-1 py-0.5">
                    <input
                      className="w-full px-2 py-1 outline-none"
                      value={r[k] ?? ""}
                      onChange={e => onCellChange(ri, k, e.target.value)}
                      onBlur={e => onCellBlur(ri, k, e.target.value)}
                      placeholder={DATE_FIELDS.includes(k) ? "MM/DD/YY" : (DATETIME_FIELDS.includes(k) ? "MM/DD/YY hh:mm am/pm" : "")}
                    />
                  </td>
                ))}
                <td className="border px-2 py-1 text-center">
                  <button onClick={() => delRow(ri)} className="text-red-600 hover:underline">Del</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={header.length + 2} className="text-center text-gray-500 py-6">No data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
