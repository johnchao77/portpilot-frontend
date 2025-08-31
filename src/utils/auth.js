// src/utils/auth.js
// 管理登入狀態、目前使用者與角色判斷。

const AUTH_KEY = "pp_auth";
const USER_KEY = "pp_user";

export const ROLES = ["Admin", "Dispatcher", "Drayage", "Warehouse"];

export function getAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isSignedIn() {
  const a = getAuth();
  return !!(a && a.ok);
}

export function getCurrentUser() {
  const a = getAuth();
  if (a && a.user) return a.user;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function hasRole(role) {
  const u = getCurrentUser();
  if (!u || !u.role) return false;
  return String(u.role).toLowerCase() === String(role).toLowerCase();
}

export function inAnyRole(...roles) {
  const u = getCurrentUser();
  if (!u || !u.role) return false;
  const mine = String(u.role).toLowerCase();
  return roles.some(r => String(r).toLowerCase() === mine);
}

export function saveAuth(token, user) {
  const payload = { ok: true, token: token || "ok", user: user || null };
  localStorage.setItem(AUTH_KEY, JSON.stringify(payload));
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function signOut() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAdmin() {
  const u = getCurrentUser();
  return (u?.role || "").toLowerCase() === "admin";
}

export default {
  ROLES,
  getAuth,
  isSignedIn,
  getCurrentUser,
  hasRole,
  inAnyRole,
  saveAuth,
  signOut,
  isAdmin,
};
