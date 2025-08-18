import React, { useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setOkMsg("");

    const email = e.target.email.value.trim();
    const password = e.target.password.value;

    if (!recaptchaToken) {
      setErrorMsg("請先完成 I'm not a robot 驗證");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${process.env.REACT_APP_API_URL || ""}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, recaptcha_token: recaptchaToken }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.message || "登入失敗，請確認帳號、密碼與驗證");
        return;
      }
      setOkMsg("登入成功（reCAPTCHA 後端驗證 OK）");
      // TODO: 保存 JWT、導向 dashboard
    } catch (err) {
      setErrorMsg("無法連線伺服器，請稍後再試");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-[282px] rounded-2xl bg-white px-6 py-4 shadow-lg">
        {/* Logo + Title Combined */}
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

          {/* reCAPTCHA (compact + slight scale) */}
          <div className="flex justify-center">
            <div className="transform scale-[0.92] origin-top">
              <ReCAPTCHA
                sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
                size="compact"
                onChange={(token) => setRecaptchaToken(token)}
                onExpired={() => setRecaptchaToken(null)}
              />
            </div>
          </div>

          {/* messages */}
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

        {/* Debug Info for CORS issue */}
        {!process.env.REACT_APP_API_URL && (
          <p className="mt-2 text-xs text-red-500 text-center">⚠️ Missing REACT_APP_API_URL in .env</p>
        )}
      </div>
    </div>
  );
}
