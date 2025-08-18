// src/pages/PortPilotLoginPage.jsx
// 說明：此檔保留你的原本 UI/版型，只在「成功登入」時多做兩件事：存 pp_auth 與導向 /dashboard
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// 若你有用 reCAPTCHA、API SDK，請在這裡 import 你原本用的模組
// import ReCAPTCHA from "react-google-recaptcha";
// import { loginApi } from "@/apis/auth"; // 範例，依你的專案調整

export default function PortPilotLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  // 依你的原始欄位補上
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // ======= 這裡放你原本的登入流程（API + reCAPTCHA）=======
      // const res = await loginApi({ email, password, recaptchaToken });
      // const { token, ok } = res.data; // 依你的回傳格式取值
      // if (!ok || !token) throw new Error("Invalid credential or response.");

      // ======= Demo: 假資料，請改成你的實際回傳 =======
      const token = "demo-token-123"; // ← 用你的 API 回傳值
      // ==============================================

      // ✅ 關鍵 1：登入成功後，存入 localStorage
      localStorage.setItem("pp_auth", JSON.stringify({ ok: true, token }));

      // ✅ 關鍵 2：導向 Dashboard
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      setErrorMsg("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* ======= 把你原本的登入頁 UI/表單整段貼到下面區塊 ======= */}
      {/* 例如：卡片、Logo、輸入框、reCAPTCHA、按鈕、風格樣式等 */}
      <form onSubmit={handleSubmit} style={{ width: 420 }}>
        <h2>PortPilot Login</h2>

        {/* 以下是範例欄位，請用你的原始 UI 元件替換 */}
        <div style={{ marginTop: 12 }}>
          <label>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        {/* 如果你有用 reCAPTCHA，把元件貼回來並在 onChange 設定 setRecaptchaToken */}
        {/* <ReCAPTCHA sitekey="你的siteKey" onChange={setRecaptchaToken} /> */}

        <button type="submit" disabled={loading} style={{ marginTop: 16 }}>
          {loading ? "Signing in..." : "Sign in"}
        </button>

        {!!errorMsg && (
          <p style={{ color: "red", marginTop: 12 }}>{errorMsg}</p>
        )}
      </form>
      {/* ======= 你的原本 UI 區塊結束 ======= */}
    </div>
  );
}
