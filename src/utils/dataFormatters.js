// src/utils/dataFormatters.js

// 小工具
function pad2(n) { return String(n).padStart(2, "0"); }
function isValidMD(y, m, d) {
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}
function twoDigitYear(y) { return String(y).slice(-2); }

// 顯示：把 ISO(YYYY-MM-DD) 或 Date 可識別字串 → "MM/DD/YY"
export function toDisplayDate(s) {
  if (!s) return "";
  const t = String(s).trim();

  // 已是 MM/DD/YY(YYYY) 就按兩位年回傳
  const mdy = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2}|\d{4})$/);
  if (mdy) {
    const m = parseInt(mdy[1], 10), d = parseInt(mdy[2], 10);
    let y = mdy[3].length === 2 ? 2000 + parseInt(mdy[3], 10) : parseInt(mdy[3], 10);
    if (!isValidMD(y, m, d)) return "";
    return `${pad2(m)}/${pad2(d)}/${twoDigitYear(y)}`;
  }

  // ISO 日期
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const y = parseInt(iso[1], 10), m = parseInt(iso[2], 10), d = parseInt(iso[3], 10);
    if (!isValidMD(y, m, d)) return "";
    return `${pad2(m)}/${pad2(d)}/${twoDigitYear(y)}`;
  }

  // 其他能被 Date 解析的字串
  const d = new Date(t);
  if (!isNaN(d)) {
    const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
    return `${pad2(m)}/${pad2(day)}/${twoDigitYear(y)}`;
  }
  return "";
}

// 顯示：把 ISO(YYYY-MM-DD HH:MM:SS) 或 Date 可識別字串 → "MM/DD/YY hh:mm am/pm"
export function toDisplayDateTime(s) {
  if (!s) return "";
  const t = String(s).trim();

  // ISO 日期時間（允許空白或 T）
  const iso = t.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  let y, m, d, H = 0, M = 0;
  if (iso) {
    y = parseInt(iso[1], 10);
    m = parseInt(iso[2], 10);
    d = parseInt(iso[3], 10);
    if (iso[4]) H = parseInt(iso[4], 10);
    if (iso[5]) M = parseInt(iso[5], 10);
  } else {
    const dt = new Date(t);
    if (isNaN(dt)) return "";
    y = dt.getFullYear(); m = dt.getMonth() + 1; d = dt.getDate();
    H = dt.getHours(); M = dt.getMinutes();
  }

  if (!isValidMD(y, m, d)) return "";
  const ap = H >= 12 ? "pm" : "am";
  let hh = H % 12; if (hh === 0) hh = 12;
  return `${pad2(m)}/${pad2(d)}/${twoDigitYear(y)} ${pad2(hh)}:${pad2(M)} ${ap}`;
}

/**
 * 正規化：把使用者輸入的日期/日期時間字串 → ISO
 * - isDateTime=false: 回傳 "YYYY-MM-DD"
 * - isDateTime=true : 回傳 "YYYY-MM-DD HH:MM:00"
 * 可接受：
 *   M/D/YY(YYYY)
 *   M-D-YY(YYYY)
 *   以上搭配 " hh:mm am/pm"
 *   已是 ISO 也接受
 *   若年份缺漏，補當年；兩位年補 20xx
 */
export function normalizeDateInput(input, isDateTime = false) {
  const s = String(input || "").trim();
  if (!s) return "";

  // 先吃已是 ISO
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    const y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
    if (!isValidMD(y, mo, d)) return "";
    if (isDateTime) {
      const H = m[4] ? parseInt(m[4], 10) : 0;
      const Mi = m[5] ? parseInt(m[5], 10) : 0;
      return `${y}-${pad2(mo)}-${pad2(d)} ${pad2(H)}:${pad2(Mi)}:00`;
    }
    return `${y}-${pad2(mo)}-${pad2(d)}`;
  }

  // M/D(/YY|YYYY)? [hh:mm am/pm]（/ 或 - 都可）
  m = s.match(
    /^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2}|\d{4}))?(?:\s+(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?)?$/
  );
  if (m) {
    const nowY = new Date().getFullYear();
    const mo = parseInt(m[1], 10);
    const d = parseInt(m[2], 10);
    let y = m[3] ? parseInt(m[3], 10) : nowY;
    if (String(y).length === 2) y = 2000 + y;

    if (!isValidMD(y, mo, d)) return "";

    if (isDateTime) {
      let H = m[4] ? parseInt(m[4], 10) : 0;
      const Mi = m[5] ? parseInt(m[5], 10) : 0;
      const ap = m[6];
      if (ap) {
        const isPM = ap.toLowerCase() === "pm";
        if (H === 12) H = isPM ? 12 : 0;
        else if (isPM) H += 12;
      }
      if (H < 0 || H > 23 || Mi < 0 || Mi > 59) return "";
      return `${y}-${pad2(mo)}-${pad2(d)} ${pad2(H)}:${pad2(Mi)}:00`;
    }
    return `${y}-${pad2(mo)}-${pad2(d)}`;
  }

  // 最後嘗試 Date 解析
  const dt = new Date(s);
  if (!isNaN(dt)) {
    const y = dt.getFullYear(), mo = dt.getMonth() + 1, d = dt.getDate();
    if (!isValidMD(y, mo, d)) return "";
    if (isDateTime) {
      const H = dt.getHours(), Mi = dt.getMinutes();
      return `${y}-${pad2(mo)}-${pad2(d)} ${pad2(H)}:${pad2(Mi)}:00`;
    }
    return `${y}-${pad2(mo)}-${pad2(d)}`;
  }

  // 解析不了 → 保守回空
  return "";
}
