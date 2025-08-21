// src/utils/dataFormatters.js
// 日期顯示：mm/dd/yy；日期時間顯示：mm/dd/yy hh:mm am/pm
export const toDisplayDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
};

export const toDisplayDateTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  let hh = d.getHours();
  const ampm = hh >= 12 ? "pm" : "am";
  hh = hh % 12; if (hh === 0) hh = 12;
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd}/${yy} ${hh}:${mi} ${ampm}`;
};

// ---- 解析輸入並自動補年份 ----
// 支援： 3/10, 03/10, 3/10/25, 03/10/2025, 3/10 9:30, 3/10 9:30pm ...
// 若沒年份，補以今年
export const normalizeDateInput = (raw, withTime = false) => {
  if (!raw) return "";
  const s = String(raw).trim();
  if (!s) return "";

  const now = new Date();
  const yThis = now.getFullYear();

  // m/d[/yy|yyyy][ time]
  const re = /^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?(?:\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?$/i;
  const m = s.match(re);
  if (!m) {
    // 交給原生 Date 嘗試
    const d2 = new Date(s);
    if (Number.isNaN(d2.getTime())) return "";
    return withTime
      ? d2.toISOString().slice(0, 16).replace("T", " ")
      : d2.toISOString().slice(0, 10);
  }

  let [, m1, d1, y1, hh, mi, ap] = m;
  let Y = y1 ? (y1.length === 2 ? (2000 + parseInt(y1, 10)) : parseInt(y1, 10)) : yThis;
  const M = Math.min(12, Math.max(1, parseInt(m1, 10)));
  const D = Math.min(31, Math.max(1, parseInt(d1, 10)));

  if (!withTime) {
    const iso = new Date(Y, M - 1, D, 12, 0, 0); // 12:00 防時區誤差
    return iso.toISOString().slice(0, 10);
  } else {
    let H = hh ? parseInt(hh, 10) : 0;
    const Min = mi ? parseInt(mi, 10) : 0;
    if (ap) {
      const apLower = ap.toLowerCase();
      if (apLower === "pm" && H < 12) H += 12;
      if (apLower === "am" && H === 12) H = 0;
    }
    const dt = new Date(Y, M - 1, D, H, Min, 0);
    return dt.toISOString().slice(0, 16).replace("T", " ");
  }
};
