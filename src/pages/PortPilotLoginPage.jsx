// src/pages/PortPilotLoginPage.jsx
// 說明：登入成功後寫入 pp_auth，並導向 /dashboard。錯誤訊息全部使用英文。
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// 若有使用 ReCAPTCHA / API，照你既有的 import

export default function PortPilotLoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // TODO: 呼叫你的後端 API 做驗證（略）
      // const res = await fetch(...)

      // === 模擬：驗證成功 ===
      const fakeToken = "demo-token-123"; // TODO: 換成後端回傳
      localStorage.setItem(
        "pp_auth",
        JSON.stringify({ ok: true, token: fakeToken })
      );

      // 導向 Dashboard
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      setErrorMsg("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "80px auto" }}>
      <h2>PortPilot Login</h2>
      <form onSubmit={handleSubmit}>
        {/* 你的帳密欄位 / reCAPTCHA 放這裡 */}
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      {!!errorMsg && (
        <p style={{ color: "red", marginTop: 12 }}>{errorMsg}</p>
      )}
    </div>
  );
}
