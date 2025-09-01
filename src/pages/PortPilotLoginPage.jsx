// src/pages/PortPilotLoginPage.jsx
// 說明：保留舊 UI 與狀態命名，整合新邏輯：成功登入時同時寫入 pp_auth 與 pp_user，然後導向 /dashboard。
// 顯示給使用者的訊息一律英文；中文僅作為註解。

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

export default function Login() {
  // ---- 舊版狀態 ----
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const navigate = useNavigate();
  const recaptchaRef = useRef(null); // 失敗時 reset

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setOkMsg("");

    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    // --- 檢查 reCAPTCHA 必填 ---
    if (!recaptchaToken) {
      setErrorMsg('Please complete the "I\'m not a robot" verification.');
      return;
    }

    // --- 檢查 API base ---
    const apiBase = process.env.REACT_APP_API_URL;
    if (!apiBase) {
      setErrorMsg("API base URL is not configured. Please set REACT_APP_API_URL.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${apiBase}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          recaptcha_token: recaptchaToken,
        }),
      });

      const data = await res.json().catch(() => ({}));

      // --- 失敗：維持英文訊息並重置 reCAPTCHA ---
      if (!res.ok || !data.ok) {
        if (res.status === 401) {
          setErrorMsg("Invalid email or password.");
        } else if (res.status === 400) {
          setErrorMsg("reCAPTCHA validation failed. Please try again.");
        } else if (res.status === 403) {
          setErrorMsg("Access forbidden. Please contact the administrator.");
        } else {
          setErrorMsg(
            data.error ||
              data.message ||
              "Sign-in failed. Please check your credentials and verification."
          );
        }
        if (recaptchaRef.current) recaptchaRef.current.reset();
        setRecaptchaToken(null);
        return;
      }

     // --- 成功：寫入登入狀態（把 user 放進 pp_auth，並保留 pp_user 相容） ---
      const token = data.token || "ok";
      const user = {
        email: data.user?.email || email,
        role:  data.user?.role  || "user",
        name:  data.user?.name  || "",
        company:       data.user?.company || "",
        company_code:  data.user?.company_code || "",
        remark:        data.user?.remark || "",
      };

      // ProtectedRoute / AdminRoute 可從 pp_auth.user.role 取得角色
      localStorage.setItem("pp_auth", JSON.stringify({ ok: true, token, user }));

      // 舊程式若讀取 pp_user，這裡也同步一份（可日後移除）
      localStorage.setItem("pp_user", JSON.stringify(user));

      setOkMsg("Signed in successfully. Redirecting...");
      setTimeout(() => navigate("/dashboard", { replace: true }), 600);

    } catch (err) {
      console.error(err);
      setErrorMsg("Unable to reach the server. Please try again later.");
      if (recaptchaRef.current) recaptchaRef.current.reset();
      setRecaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-[282px] rounded-2xl bg-white px-6 py-4 shadow-lg">
        {/* Logo + Title */}
        <div className="mb-1 flex flex-col items-center space-y-1">
          <img src="/logo-triangle.png" alt="PortPilot Logo" className="h-16 w-16" />
          <h1 className="text-blue-600 text-lg font-bold">PortPilot</h1>
          <h2 className="text-center text-xs font-medium -mt-1">Supply Chain Intelligration</h2>
        </div>

        <h1 className="text-center text-sm font-bold mb-3">Sign in</h1>

        {/* Form */}
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              placeholder="admin@test.com"
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="********"
                className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 pr-9 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-2 my-auto text-xs text-blue-600 hover:underline"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* reCAPTCHA */}
          <div className="flex justify-center">
            <div className="transform scale-[0.92] origin-top">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
                size="compact"
                onChange={(token) => setRecaptchaToken(token)}
                onExpired={() => setRecaptchaToken(null)}
              />
            </div>
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-2 py-1">
              {errorMsg}
            </div>
          )}
          {okMsg && (
            <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-1">
              {okMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-white text-base font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Debug Info for missing API base */}
        {!process.env.REACT_APP_API_URL && (
          <p className="mt-2 text-xs text-red-500 text-center">
            ⚠️ Missing REACT_APP_API_URL in .env
          </p>
        )}
      </div>
    </div>
  );
}
