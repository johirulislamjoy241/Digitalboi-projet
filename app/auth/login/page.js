"use client";
import { useState } from "react";
import { T } from "@/lib/design";
import { Btn, Input } from "@/lib/ui";

export default function LoginPage({ onLogin, onRegister, onForgot }) {
  const [ident,    setIdent]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const loginPassword = async () => {
    if (!ident || !password) return setError("ফোন/ইমেইল ও পাসওয়ার্ড দিন");
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: ident, password })
      });
      const d = await res.json();
      if (d.success) {
        localStorage.setItem("digiboi_token", d.token);
        localStorage.setItem("digiboi_user",  JSON.stringify(d.user));
        onLogin(d.user);
      } else setError(d.error || "লগইন ব্যর্থ");
    } catch { setError("সার্ভার সমস্যা"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100dvh", background:T.bg, display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:T.brandGrad, padding:"56px 32px 48px", textAlign:"center" }}>
        <div style={{ fontSize:56, marginBottom:12 }}>🛒</div>
        <div style={{ color:"#fff", fontWeight:800, fontSize:30, letterSpacing:-0.5 }}>Digiboi</div>
        <div style={{ color:"rgba(255,255,255,0.85)", fontSize:14, marginTop:6 }}>আপনার ব্যবসার ডিজিটাল সহকারী</div>
      </div>

      <div style={{ flex:1, padding:"32px 24px", maxWidth:400, margin:"0 auto", width:"100%" }}>
        <h2 style={{ fontWeight:800, fontSize:24, color:T.text, marginBottom:6 }}>লগইন করুন</h2>
        <p style={{ color:T.textMuted, fontSize:14, marginBottom:24 }}>আপনার অ্যাকাউন্টে প্রবেশ করুন</p>

        {error && (
          <div style={{ background:"#FEE2E2", borderRadius:T.radiusSm, padding:"10px 14px", marginBottom:16, fontSize:13, color:T.danger }}>
            {error}
          </div>
        )}

        <Input label="ফোন নম্বর বা ইমেইল" value={ident} onChange={setIdent} placeholder="01XXXXXXXXX বা email@example.com" icon="phone"/>
        <Input label="পাসওয়ার্ড" type="password" value={password} onChange={setPassword} placeholder="পাসওয়ার্ড লিখুন" icon="lock"/>

        <div style={{ textAlign:"right", marginBottom:16, marginTop:-8 }}>
          <span onClick={onForgot} style={{ color:T.brand, fontSize:13, fontWeight:600, cursor:"pointer" }}>পাসওয়ার্ড ভুলে গেছেন?</span>
        </div>

        <Btn variant="primary" full onClick={loginPassword} disabled={loading}>
          {loading ? "লগইন হচ্ছে..." : "🔐 লগইন করুন"}
        </Btn>

        <div style={{ textAlign:"center", marginTop:24, fontSize:14, color:T.textMuted }}>
          নতুন ব্যবহারকারী?{" "}
          <span onClick={onRegister} style={{ color:T.brand, fontWeight:700, cursor:"pointer" }}>
            রেজিস্ট্রেশন করুন →
          </span>
        </div>
      </div>
    </div>
  );
}
