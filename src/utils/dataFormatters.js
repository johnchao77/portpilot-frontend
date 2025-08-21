// src/utils/dateFormatters.js
import dayjs from "dayjs";
import customParse from "dayjs/plugin/customParseFormat";
dayjs.extend(customParse);

// 指定欄位
export const DATE_FIELDS = ["ETD","ETA","Arrived","LFD","Appt Date","LRD","Returned Date"];
export const DATETIME_FIELDS = ["Delivered DateTime","Emptied DateTime"];

// 前端顯示格式
export const toDisplayDate = (v) => {
  if (!v) return "";
  const f = ["M/D/YY","M/D/YYYY","MM/DD/YY","MM/DD/YYYY","YYYY-MM-DD"];
  const d = dayjs(v, f, true);
  return d.isValid() ? d.format("MM/DD/YY") : "";
};

export const toDisplayDateTime = (v) => {
  if (!v) return "";
  const f = ["M/D/YY h:mm A","M/D/YYYY h:mm A","MM/DD/YY h:mm A","MM/DD/YYYY h:mm A","YYYY-MM-DD HH:mm:ss"];
  const d = dayjs(v, f, true);
  return d.isValid() ? d.format("MM/DD/YY hh:mm a") : "";
};

// 送到後端前→ISO（DB 乾淨）
export const toISODate = (v) => {
  if (!v) return "";
  const f = ["M/D/YY","M/D/YYYY","MM/DD/YY","MM/DD/YYYY","YYYY-MM-DD"];
  const d = dayjs(v, f, true);
  return d.isValid() ? d.format("YYYY-MM-DD") : "";
};

export const toISODateTime = (v) => {
  if (!v) return "";
  const f = ["M/D/YY h:mm A","M/D/YYYY h:mm A","MM/DD/YY h:mm A","MM/DD/YYYY h:mm A","YYYY-MM-DD HH:mm:ss"];
  const d = dayjs(v, f, true);
  return d.isValid() ? d.format("YYYY-MM-DD HH:mm:ss") : "";
};
