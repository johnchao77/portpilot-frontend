// src/pages/MyContainers.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  toDisplayDate,
  toDisplayDateTime,
  normalizeDateInput,
} from "../utils/dataFormatters";
import ConfirmModal from "../components/ConfirmModal";

const API_BASE = process.env.REACT_APP_API_URL || "https://api.portpilot.co";

/** 欄位定義（比照 Excel） */
const COLUMNS = [
  { key: "order_no",      label: "Order No",           width: 180 },
  { key: "status",        label: "Status",             width: 110 }, // 唯讀、由程式自動算
  { key: "drayage",       label: "Drayage",            width: 110 },
  { key: "warehouse",     label: "Warehouse",          width: 110 },
  { key: "mbl_no",        label: "MBL No",             width: 150 },
  { key: "container",     label: "Container No",       width: 140 },
  { key: "etd",           label: "ETD",                width: 110, type: "date" },
  { key: "eta",           label: "ETA",                width: 110, type: "date" },
  { key: "pod",           label: "POD",                width: 150 },
  { key: "arrived",       label: "Arrived",            width: 110, type: "date" },
  { key: "lfd",           label: "LFD",                width: 110, type: "date" },
  { key: "appt_date",     label: "Appt Date",          width: 130, type: "date" },
  { key: "lrd",           label: "LRD",                width: 110, type: "date" },
  { key: "delivered_dt",  label: "Delivered DateTime", width: 180, type: "datetime" },
  { key: "emptied_dt",    label: "Emptied DateTime",   width: 170, type: "datetime" },
  { key: "returned_date", label: "Returned Date",      width: 130, type: "date" },
];

const DATE_FIELDS     = new Set(COLUMNS.filter(c => c.type === "date").map(c => c.key));
const DATETIME_FIELDS = new Set(COLUMNS.filter(c => c.type === "datetime").map(c => c.key));
const LABEL_TO_KEY    = Object.fromEntries(COLUMNS.map(c => [c.label, c.key]));
const WIDTHS_KEY      = "mycontainers.colwidths";

/** 會影響 Status 的欄位 */
const AFFECTS_STATUS = new Set([
  "returned_date", "emptied_dt", "delivered_dt", "appt_date", "arrived",
  "mbl_no", "container",
]);

/** Status 顏色（Tailwind） */
const STATUS_STYLES = {
  Planning:   "bg-gray-100 text-gray-700 border border-gray-200",
  Offshore:   "bg-blue-100 text-blue-700 border border-blue-200",
  Arrival:    "bg-amber-100 text-amber-700 border border-amber-200",
  "Appt Made":"bg-purple-100 text-purple-700 border border-purple-200",
  Delivered:  "bg-green-100 text-green-700 border border-green-200",
  Emptied:    "bg-violet-100 text-violet-700 border border-violet-200",
  Returned:   "bg-red-100 text-red-700 border border-red-200",
};

/** 依規則計算 Status */
function computeStatus(r = {}) {
  const has = (k) => !!String(r?.[k] ?? "").trim();
  if (has("returned_date"))                     return "Returned";
  if (has("emptied_dt"))                        return "Emptied";
  if (has("delivered_dt"))                      return "Delivered";
  if (has("appt_date"))                         return "Appt Made";
  if (has("arrived"))                           return "Arrival";
  if (has("mbl_no") && has("container"))        return "Offshore";
  return "Planning";
}

/** 穩定列 id（勾選／刪除用） */
const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
/** 確保每列有 _id */
const ensureIds = (arr = []) => arr.map(r => (r && r._id ? r : { _id: genId(), ...r }));

/** MBL 正規化＋重複檢查工具 */
const normalizeMBL = (s) => String(s || "").trim().toLowerCase();
function findDupIndexByMBL(list, selfIdx, value) {
  const key = normalizeMBL(value);
  if (!key) return -1;
  return list.findIndex((r, i) => i !== selfIdx && normalizeMBL(r?.mbl_no) === key);
}
function findDuplicateMBLs(list) {
  const seen = new Map();
  const dups = new Set();
  for (const r of list) {
    const raw = r?.mbl_no;
    const k = normalizeMBL(raw);
    if (!k) continue;
    if (seen.has(k)) { dups.add(seen.get(k)); dups.add(raw); }
    else seen.set(k, raw);
  }
  return [...dups];
}

/** 狀態標籤（唯讀） */
function StatusBadge({ value }) {
  const v = value || "Planning";
  const cls = STATUS_STYLES[v] || STATUS_STYLES.Planning;
  return <span className={`inline-block px-2 py-0.5 text-xs rounded ${cls}`}>{v}</span>;
}

export default function MyContainers() {
  const [rows, setRows]               = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [toDeleteCount, setToDeleteCount] = useState(0);
  const [loading, setLoading]         = useState(false);
  const [err, setErr]                 = useState("");
  const [sortKey, setSortKey]         = useState("");
  const [sortDir, setSortDir]         = useState(0); // 0 none / 1 asc / -1 desc
  const [widths, setWidths]           = useState(() => {
    const saved = localStorage.getItem(WIDTHS_KEY);
    if (saved) return JSON.parse(saved);
    const w = {}; COLUMNS.forEach(c => (w[c.key] = c.width || 120)); return w;
  });

  // 匯入 Excel 的隱藏 input
  const fileInputRef = useRef(null);

  // 儲存欄寬
  useEffect(() => {
    localStorage.setItem(WIDTHS_KEY, JSON.stringify(widths));
  }, [widths]);

  // 第一次載入
  useEffect(() => {
    (async () => {
      setLoading(true); setErr("");
      try {
        const r = await fetch(`${API_BASE}/my-containers`);
        const j = await r.json();
        if (!r.ok || !j.ok) throw new Error(j.error || "load failed");
        const withIds    = ensureIds(j.rows || []);
        const withStatus = withIds.map(x => ({ ...x, status: computeStatus(x) }));
        setRows(withStatus);
      } catch (e) {
        console.error(e); setErr("Load failed.");
      } finally { setLoading(false); }
    })();
  }, []);

  /** ➊ 新增一列（預設狀態為 Planning） */
  const onAddRow = () => {
    setRows(r => [{ _id: genId(), status: "Planning" }, ...r]);
  };

  /** ➋ 勾選／刪除 */
  const toggleSelect = (rowId, checked) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(rowId); else next.delete(rowId);
      return next;
    });
  };
  const askDelete = () => {
    const n = selectedIds.size; if (!n) return;
    setToDeleteCount(n); setDeleteOpen(true);
  };
  const confirmDelete = () => {
    setRows(prev => prev.filter(r => !selectedIds.has(r._id)));
    setSelectedIds(new Set()); setDeleteOpen(false);
  };

  /** ➌ 單格變更／失焦正規化＋狀態重算＋MBL 即時檢查 */
  const onCellChange = (idx, key, v) => {
    setRows(r => {
      const copy = [...r]; copy[idx] = { ...copy[idx], [key]: v }; return copy;
    });
  };

  const onCellBlur = (idx, key) => {
    setRows(r => {
      const copy = [...r];
      const val = copy[idx]?.[key];

      // 先處理日期/時間 → ISO
      if (DATE_FIELDS.has(key)) {
        copy[idx][key] = normalizeDateInput(val, false) || "";
      } else if (DATETIME_FIELDS.has(key)) {
        copy[idx][key] = normalizeDateInput(val, true) || "";
      }

      // MBL No. 即時重複檢查
      if (key === "mbl_no") {
        const v = copy[idx][key];
        const dupIdx = findDupIndexByMBL(copy, idx, v);
        if (dupIdx !== -1) {
          alert(
            `MBL No. "${v}" already exists at row ${dupIdx + 1}.\n` +
            "Please use a unique MBL No. (it has been cleared)."
          );
          copy[idx][key] = "";
        }
      }

      // 若為影響狀態之欄位 → 重算 Status
      if (AFFECTS_STATUS.has(key)) {
        copy[idx].status = computeStatus(copy[idx]);
      }
      return copy;
    });
  };

  /** ➍ 儲存：先總體檢查 MBL 重複，再送 API */
  const onSave = async () => {
    // 總體重複檢查（保險）
    const dupList = findDuplicateMBLs(rows);
    if (dupList.length) {
      setErr(`Duplicate MBL No.: ${dupList.join(", ")}. Please resolve before saving.`);
      return;
    }

    setLoading(true); setErr("");
    try {
      const r = await fetch(`${API_BASE}/my-containers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "save failed");
    } catch (e) {
      console.error(e); setErr("Save failed.");
    } finally { setLoading(false); }
  };

  /** ➎ 匯出 */
  const onExport = () => {
    const aoa = [
      COLUMNS.map(c => c.label),
      ...rows.map(r => COLUMNS.map(c => formatForDisplay(r[c.key], c))),
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, "MyContainers");
    XLSX.writeFile(wb, "MyContainers.xlsx");
  };

  /** ➏ 匯入（append/overwrite；append 時遇重複 MBL 詢問 O/S/C） */
  const onClickImport = () => fileInputRef.current?.click();
  const onImportFile = async (e) => {
    setErr("");
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const buf = await file.arrayBuffer();
      const wb  = XLSX.read(buf, { type: "array" });
      const ws  = wb.Sheets[wb.SheetNames[0]];
      if (!ws) throw new Error("No worksheet found.");
      const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
      if (aoa.length < 2) throw new Error("Worksheet has no data.");

      const headers  = (aoa[0] || []).map(h => String(h || "").trim());
      const expected = COLUMNS.map(c => c.label);
      const missing  = expected.filter(l => !headers.includes(l));
      if (missing.length) {
        throw new Error(
          `Invalid columns.\nMissing: ${missing.join(", ")}\n` +
          `Headers in file: ${headers.join(", ")}`
        );
      }

      const importedRows = aoa.slice(1).map((rowArr) => {
        const obj = {};
        COLUMNS.forEach((c) => {
          const idx  = headers.indexOf(c.label);
          const cell = idx >= 0 ? rowArr[idx] : "";
          obj[c.key] = normalizeCellForImport(cell, c);
        });
        obj.status = computeStatus(obj);
        return obj;
      });

      let mode = window.prompt(
        'Import mode: type "append" or "overwrite".\n- append: add to existing, ask on duplicates.\n- overwrite: replace all existing rows.',
        "append"
      );
      if (!mode) return;
      mode = mode.toLowerCase();
      if (mode !== "append" && mode !== "overwrite") {
        alert('Invalid mode. Use "append" or "overwrite".'); return;
      }

      if (mode === "overwrite") {
        setRows(ensureIds(importedRows));
        alert(`Imported ${importedRows.length} rows. Click "Save" to apply.`);
        return;
      }

      // append：遇重複 MBL 詢問
      const existingByMbl = new Map(
        rows.map((r, i) => [normalizeMBL(r.mbl_no), { idx: i, row: r }])
      );
      let cancelled = false;
      const merged = [...rows];

      for (const newRow of importedRows) {
        const raw = String(newRow.mbl_no || "").trim();
        if (!raw) { merged.push(newRow); continue; }
        const key = normalizeMBL(raw);

        if (!existingByMbl.has(key)) {
          merged.push(newRow);
          existingByMbl.set(key, { idx: merged.length - 1, row: newRow });
          continue;
        }

        const action = window.prompt(
          `Duplicate MBL No. "${raw}".\nType "o" to Overwrite, "s" to Skip, "c" to Cancel import.`,
          "o"
        );
        if (!action) continue;
        const a = action.toLowerCase();
        if (a === "c") { cancelled = true; break; }
        if (a === "s") { continue; }
        if (a === "o") {
          const { idx } = existingByMbl.get(key);
          merged[idx] = { ...merged[idx], ...newRow };
        }
      }

      if (cancelled) { alert("Import cancelled."); return; }
      setRows(ensureIds(merged));
      alert(`Imported (append) done. New total: ${merged.length}. Click "Save" to apply.`);
    } catch (ex) {
      console.error(ex); setErr(ex.message || "Import failed.");
    }
  };

  /** ➐ 排序 */
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
      return sortDir * String(va).localeCompare(String(vb));
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  /** ➑ 欄寬拖拉 */
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
    if (sortKey !== key) { setSortKey(key); setSortDir(1); }
    else setSortDir(d => (d === 1 ? -1 : d === -1 ? 0 : 1));
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
        <button className="px-3 py-1 rounded bg-amber-600 text-white" onClick={onClickImport}>
          Import Excel
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

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={onImportFile}
        />

        {err && <span className="text-red-600 ml-2">{err}</span>}
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              {/* 勾選欄 Header */}
              <th style={{ width: 36, minWidth: 36 }} className="sticky top-0 bg-white border-b px-2 py-2">&nbsp;</th>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  style={{ width: widths[col.key], minWidth: widths[col.key] }}
                  className="sticky top-0 bg-white border-b px-2 py-2 text-left text-sm font-semibold relative select-none"
                >
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
                <td colSpan={COLUMNS.length + 1} className="text-center text-gray-500 py-8">
                  No data.
                </td>
              </tr>
            ) : sorted.map((row, idx) => (
              <tr key={row._id ?? idx} className="border-t">
                {/* 勾選欄 */}
                <td style={{ width: 36, minWidth: 36 }} className="px-2 py-1 align-top">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row._id)}
                    onChange={(e) => toggleSelect(row._id, e.target.checked)}
                  />
                </td>

                {COLUMNS.map(col => (
                  <td
                    key={col.key}
                    style={{ width: widths[col.key], minWidth: widths[col.key] }}
                    className="px-2 py-1 align-top"
                  >
                    {col.key === "status" ? (
                      <StatusBadge value={row.status} />
                    ) : (
                      <Cell
                        value={row[col.key]}
                        col={col}
                        onChange={(v) => onCellChange(idx, col.key, v)}
                        onBlur={() => onCellBlur(idx, col.key)}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <ConfirmModal
          open={isDeleteOpen}
          title="Remove selected rows"
          message={`You’re about to remove ${toDeleteCount} selected ${toDeleteCount === 1 ? "row" : "rows"}.\n\nNote: they won’t be permanently deleted until you click “Save”.`}
          confirmText="Remove"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      </div>
    </div>
  );
}

/** 單格編輯（Status 以外） */
function Cell({ value, col, onChange, onBlur }) {
  const display = formatForDisplay(value, col);
  const [v, setV] = useState(display);

  useEffect(() => setV(display), [display]);

  return (
    <input
      className="w-full border rounded px-2 py-1 text-sm"
      value={v ?? ""}
      onChange={(e) => { setV(e.target.value); onChange(e.target.value); }}
      onBlur={onBlur}
      placeholder={
        col.type === "datetime" ? "mm/dd/yy hh:mm am/pm" :
        col.type === "date"     ? "mm/dd/yy" : ""
      }
    />
  );
}

/** 顯示用格式化（ISO -> UI；非 ISO 不動它，讓使用者能完整輸入） */
function formatForDisplay(val, col) {
  if (!val) return "";
  if (col.type === "date") {
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(val);
    return iso ? toDisplayDate(val) : String(val);
  }
  if (col.type === "datetime") {
    const isoDT = /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(val);
    return isoDT ? toDisplayDateTime(val) : String(val);
  }
  return String(val);
}

/** 匯入用：將 Excel cell 正規化成儲存格式 */
function normalizeCellForImport(cell, col) {
  if (cell == null) return "";
  const s = String(cell).trim();
  if (col.type === "date")     return normalizeDateInput(s, false) || "";
  if (col.type === "datetime") return normalizeDateInput(s, true)  || "";
  return s;
}
