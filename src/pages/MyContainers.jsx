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

/**
 * 欄位定義（完全比照 Excel）
 * key：內部欄位名稱
 * label：Excel 欄位名稱（必須完全相同）
 * width：初始欄寬
 * type：空白、"date"、"datetime"
 */
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

const DATE_FIELDS = new Set(COLUMNS.filter((c) => c.type === "date").map((c) => c.key));
const DATETIME_FIELDS = new Set(COLUMNS.filter((c) => c.type === "datetime").map((c) => c.key));
const WIDTHS_KEY = "mycontainers.colwidths";

// 產生穩定的列 id（用來做勾選與刪除）
const genId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// 確保每列都有 _id（舊資料沒有的話幫它補上）
const ensureIds = (arr = []) => arr.map((r) => (r && r._id ? r : { _id: genId(), ...r }));

export default function MyContainers() {
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteCount, setToDeleteCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [sortKey, setSortKey] = useState("");
  const [sortDir, setSortDir] = useState(0); // 0: none, 1: asc, -1: desc

  const [widths, setWidths] = useState(() => {
    const saved = localStorage.getItem(WIDTHS_KEY);
    if (saved) return JSON.parse(saved);
    const w = {};
    COLUMNS.forEach((c) => (w[c.key] = c.width || 120));
    return w;
  });

  // 匯入 Excel 用的隱藏 <input type="file">
  const fileInputRef = useRef(null);

  // 儲存欄寬
  useEffect(() => {
    localStorage.setItem(WIDTHS_KEY, JSON.stringify(widths));
  }, [widths]);

  // 第一次載入
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const r = await fetch(`${API_BASE}/my-containers`);
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

  /** 新增一列 */
  const onAddRow = () => {
    setRows((r) => [{ _id: genId() }, ...r]);
  };

  /** 勾選和刪除 */
  const toggleSelect = (rowId, checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(rowId);
      else next.delete(rowId);
      return next;
    });
  };

  const askDelete = () => {
    const n = selectedIds.size;
    if (n === 0) return;
    setToDeleteCount(n);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    setRows((prev) => prev.filter((r) => !selectedIds.has(r._id)));
    setSelectedIds(new Set());
    setConfirmOpen(false);
  };

  /** cell 變更 */
  const onCellChange = (idx, key, v) => {
    setRows((r) => {
      const copy = [...r];
      copy[idx] = { ...copy[idx], [key]: v };
      return copy;
    });
  };

  /** 失焦：正規化日期/時間（自動補年份、轉 ISO） */
  const onCellBlur = (idx, key) => {
    setRows((r) => {
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

  /** 儲存到後端 */
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

  /** 匯出 Excel */
  const onExport = () => {
    const aoa = [
      COLUMNS.map((c) => c.label),
      ...rows.map((r) => COLUMNS.map((c) => formatForDisplay(r[c.key], c))),
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, "MyContainers");
    XLSX.writeFile(wb, "MyContainers.xlsx");
  };

  /** 觸發匯入 */
  const onClickImport = () => fileInputRef.current?.click();

  /** 匯入 Excel 檔處理 */
  const onImportFile = async (e) => {
    setErr("");
    const file = e.target.files?.[0];
    e.target.value = ""; // 同檔多次上傳也能觸發
    if (!file) return;

    try {
      // 1) 讀取 Excel
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) throw new Error("No worksheet found.");

      // 以 AOA 讀進來（第一列是標題）
      const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
      if (aoa.length < 2) throw new Error("Worksheet has no data.");

      const headers = (aoa[0] || []).map((h) => String(h || "").trim());

      // 2) 欄位檢查：必須完全符合
      const expected = COLUMNS.map((c) => c.label);
      const missing = expected.filter((l) => !headers.includes(l));
      if (missing.length > 0) {
        throw new Error(
          `Invalid columns.\nMissing: ${missing.join(", ")}\n` +
            `Headers in file: ${headers.join(", ")}`
        );
      }

      // 3) 組成列資料（依 COLUMNS 順序）
      const importedRows = aoa.slice(1).map((rowArr) => {
        const obj = {};
        COLUMNS.forEach((c) => {
          const idx = headers.indexOf(c.label);
          const cell = idx >= 0 ? rowArr[idx] : "";
          obj[c.key] = normalizeCellForImport(cell, c);
        });
        return obj;
      });

      // 4) 匯入模式
      let mode = window.prompt(
        'Import mode: type "append" or "overwrite".\n- append: add to existing, ask on duplicates.\n- overwrite: replace all existing rows.',
        "append"
      );
      if (!mode) return;
      mode = mode.toLowerCase();
      if (mode !== "append" && mode !== "overwrite") {
        alert('Invalid mode. Use "append" or "overwrite".');
        return;
      }

      if (mode === "overwrite") {
        setRows(importedRows.map((r) => ({ _id: genId(), ...r })));
        alert(`Imported ${importedRows.length} rows. Click "Save" to apply.`);
        return;
      }

      // mode === "append"
      const existingByMbl = new Map(
        rows.map((r, i) => [String(r.mbl_no || "").toLowerCase(), { idx: i, row: r }])
      );

      let cancelled = false;
      const merged = [...rows];

      for (const newRow of importedRows) {
        const mbl = String(newRow.mbl_no || "").trim();
        if (!mbl) {
          merged.push({ _id: genId(), ...newRow });
          continue;
        }

        const key = mbl.toLowerCase();
        if (!existingByMbl.has(key)) {
          merged.push({ _id: genId(), ...newRow });
          existingByMbl.set(key, { idx: merged.length - 1, row: newRow });
          continue;
        }

        // 重複處理：詢問使用者
        const action = window.prompt(
          `Duplicate MBL No. "${mbl}".\nType "o" to Overwrite, "s" to Skip, "c" to Cancel import.`,
          "o"
        );
        if (!action) continue;

        const a = action.toLowerCase();
        if (a === "c") {
          cancelled = true;
          break;
        }
        if (a === "s") continue;
        if (a === "o") {
          const { idx } = existingByMbl.get(key);
          merged[idx] = { _id: merged[idx]._id, ...newRow }; // 保留原本 _id
        }
      }

      if (cancelled) {
        alert("Import cancelled.");
        return;
      }

      setRows(merged);
      alert(`Imported (append) done. New total: ${merged.length}. Click "Save" to apply.`);
    } catch (ex) {
      console.error(ex);
      setErr(ex.message || "Import failed.");
    }
  };

  /** 排序 */
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

  /** 欄寬拖拉 */
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
    setWidths((w) => ({ ...w, [col]: newW }));
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
      setSortDir((d) => (d === 1 ? -1 : d === -1 ? 0 : 1));
    }
  };

  return (
    <div className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <h1 className="text-xl font-bold">My Containers</h1>

        <button className="px-3 py-1 rounded bg-gray-100 border" onClick={onAddRow}>
          + Add Row
        </button>

        <button
          className="px-3 py-1 rounded bg-blue-600 text-white"
          onClick={onSave}
          disabled={loading}
        >
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
          title={
            selectedIds.size
              ? `Delete ${selectedIds.size} selected row(s)`
              : "Select rows to enable"
          }
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
              {/* 勾選欄（Header） */}
              <th
                style={{ width: 36, minWidth: 36 }}
                className="sticky top-0 bg-white border-b px-2 py-2"
              >
                &nbsp;
              </th>

              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  style={{ width: widths[col.key], minWidth: widths[col.key] }}
                  className="sticky top-0 bg-white border-b px-2 py-2 text-left text-sm font-semibold relative select-none"
                >
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleSort(col.key)} className="text-left">
                      {col.label}
                      {sortKey === col.key
                        ? sortDir === 1
                          ? " ▲"
                          : sortDir === -1
                          ? " ▼"
                          : ""
                        : ""}
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
            ) : (
              sorted.map((row, idx) => (
                <tr key={row._id ?? idx} className="border-t">
                  {/* 每列最前面：核取方塊欄 */}
                  <td style={{ width: 36, minWidth: 36 }} className="px-2 py-1 align-top">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row._id)}
                      onChange={(e) => toggleSelect(row._id, e.target.checked)}
                    />
                  </td>

                  {/* 其餘欄位 */}
                  {COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      style={{ width: widths[col.key], minWidth: widths[col.key] }}
                      className="px-2 py-1 align-top"
                    >
                      <Cell
                        value={row[col.key]}
                        col={col}
                        onChange={(v) => onCellChange(idx, col.key, v)}
                        onBlur={() => onCellBlur(idx, col.key)}
                      />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>

        <ConfirmModal
          open={confirmOpen}
          title="Remove selected rows"
          message={`You’re about to remove ${toDeleteCount} selected ${
            toDeleteCount === 1 ? "row" : "rows"
          }.\n\nNote: They won’t be permanently deleted until you click “Save”.`}
          confirmText="Remove"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      </div>
    </div>
  );
}

/** 單格編輯元件 */
function Cell({ value, col, onChange, onBlur }) {
  const display = formatForDisplay(value, col);
  const [v, setV] = useState(display);

  useEffect(() => setV(display), [display]);

  return (
    <input
      className="w-full border rounded px-2 py-1 text-sm"
      value={v ?? ""}
      onChange={(e) => {
        setV(e.target.value);
        onChange(e.target.value);
      }}
      onBlur={onBlur}
      placeholder={
        col.type === "datetime" ? "mm/dd/yy hh:mm am/pm" : col.type === "date" ? "mm/dd/yy" : ""
      }
    />
  );
}

/** 顯示用格式化（ISO -> UI） */
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

/** 匯入用：把 Excel cell 轉成儲存格式（日期/時間 -> ISO；其它轉字串） */
function normalizeCellForImport(cell, col) {
  if (cell == null) return "";
  const s = String(cell).trim();
  if (col.type === "date") return normalizeDateInput(s, false) || "";
  if (col.type === "datetime") return normalizeDateInput(s, true) || "";
  return s;
}
