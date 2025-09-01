// src/components/layout/UserMenu.jsx
import React, { useEffect, useRef, useState } from "react";
import { getCurrentUser, isSignedIn } from "../../utils/auth";

const API_BASE = process.env.REACT_APP_API_URL || "https://api.portpilot.co";

function makeInitials(name, email) {
  const local = (email || "").split("@")[0] || "";
  const source = (name || "").trim() || local || "user";
  const tokens = source.split(/[^A-Za-z0-9]+/).filter(Boolean);
  let a = "", b = "";
  if (tokens.length >= 2) {
    a = tokens[0][0];
    b = tokens[tokens.length - 1][0];
  } else {
    const t = tokens[0] || "";
    if (t) {
      a = t[0];
      for (let i = 1; i < t.length; i++) if (/[A-Za-z0-9]/.test(t[i])) { b = t[i]; break; }
    }
    if (!b) {
      const fallback = (local.replace(/[^A-Za-z0-9]/g, "") || "US");
      b = fallback[1] || fallback[0] || "U";
    }
  }
  return (String(a) + String(b)).toUpperCase();
}

export default function UserMenu() {
  // ✅ 所有 Hooks 一律放在函式最上面
  const me = getCurrentUser();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [showPw, setShowPw] = useState(false);
  const panelRef = useRef(null);

  const initials = makeInitials(me?.name, me?.email);

  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => open && e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // ✅ Hooks 之後再做條件 return
  if (!isSignedIn() || !me) return null;

  async function changePassword() {
    if (!pw.trim()) {
      setErr("Password is required.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      const headers = {
        "Content-Type": "application/json",
        "X-User-Email": me.email || "",
        "X-User-Role": me.role || "",
      };
      const r = await fetch(`${API_BASE}/users/me`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ password: pw.trim() }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "Change password failed");
      setPw("");
      setOpen(false);
      alert("Password updated.");
    } catch (e) {
      setErr(e.message || "Change password failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative" data-pp-user-menu-root>
      <button
        type="button"
        data-pp-user-menu
        onClick={() => setOpen(v => !v)}
        title={me?.email || "User"}
        className="h-9 w-9 rounded-full bg-teal-500 text-white text-sm font-bold grid place-items-center shadow hover:brightness-110 focus:outline-none"
        aria-haspopup="menu"
        aria-expanded={open ? "true" : "false"}
      >
        {initials}
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          className="absolute right-0 mt-2 w-80 rounded-xl border bg-white shadow-lg p-4 z-50"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-teal-500 text-white grid place-items-center font-bold">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate">{me?.name || "—"}</div>
              <div className="text-xs text-gray-500 truncate">{me?.email}</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <LabelValue label="Role" value={me?.role} />
            <LabelValue label="Company" value={me?.company} />
            <LabelValue label="Company Code" value={me?.company_code} />
            <LabelValue label="Remark" value={me?.remark} />
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium mb-1">Change Password</div>

            {/* 密碼輸入（可顯示／隱藏） */}
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                className="w-full border rounded px-2 py-2 pr-16 text-sm"
                placeholder="New password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:underline"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>

            {err && <div className="mt-1 text-xs text-red-600">{err}</div>}

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={changePassword}
                disabled={busy}
                className="px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {busy ? "Saving..." : "Update Password"}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function LabelValue({ label, value }) {
  return (
    <div className="col-span-1">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm">{value || <span className="text-gray-400">—</span>}</div>
    </div>
  );
}
