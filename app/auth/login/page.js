"use client";
import { useState } from "react";
import { T } from "@/lib/design";
import { Btn, Input, Divider } from "@/lib/ui";
import { validateBDPhone } from "@/lib/helpers";

export default function LoginPage({ onLogin, onRegister }) {
  const [mode,     setMode]     = useState("password"); // "otp" | "password"
  const [phone,    setPhone]    = useState("");
  const [code,     setCode]     = useState("");
  const [ident,    setIdent]    = useState("");
  const [password, setPassword] = useState("");
  const [otpSent,  setOtpSent]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const sendOTP = async () => {
    if (!validateBDPhone(phone)) return setError("সঠিক বাংলাদেশি নম্বর দিন");
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/otp", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ phone, purpose:"login" }) });
      const d = await res.json();
      if (d.success) {
        setOtpSent(true);
        if (d.dev_code) setCode(d.dev_code); // dev helper
      } else setError(d.error || "OTP পাঠানো যায়নি");
    } catch { setError("সার্ভার সমস্যা"); }
    setLoading(false);
  };

  const loginOTP = async () => {
    if (!code || code.length !== 6) return setError("৬ সংখ্যার OTP দিন");
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ phone, code }) });
      const d = await res.json();
      if (d.success) {
        localStorage.setItem("digiboi_token", d.token);
        localStorage.setItem("digiboi_user",  JSON.stringify(d.user));
        onLogin(d.user);
      } else setError(d.error || "লগইন ব্যর্থ");
    } catch { setError("সার্ভার সমস্যা"); }
    setLoading(false);
  };

  const loginPassword = async () => {
    if (!ident || !password) return setError("ফোন/ইমেইল ও পাসওয়ার্ড দিন");
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ identifier:ident, password }) });
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
    <div style={{ minHeight:"100dvh",background:T.bg,display:"flex",flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:T.brandGrad,padding:"48px 32px 40px",textAlign:"center" }}>
        <div style={{ fontSize:52,marginBottom:10 }}>🛒</div>
        <div style={{ color:"#fff",fontWeight:800,fontSize:28,letterSpacing:-0.5 }}>Digiboi</div>
        <div style={{ color:"rgba(255,255,255,0.8)",fontSize:14,marginTop:6 }}>আপনার ব্যবসার ডিজিটাল সহকারী</div>
      </div>

      <div style={{ flex:1,padding:"28px 24px",maxWidth:400,margin:"0 auto",width:"100%" }}>
        <h2 style={{ fontWeight:800,fontSize:22,color:T.text,marginBottom:6 }}>লগইন করুন</h2>
        <p style={{ color:T.textMuted,fontSize:14,marginBottom:24 }}>আপনার অ্যাকাউন্টে প্রবেশ করুন</p>

        {/* Mode toggle */}
        <div style={{ display:"flex",background:"#F0F2F8",borderRadius:10,padding:3,marginBottom:20 }}>
          {[{id:"password",label:"পাসওয়ার্ড"},{id:"otp",label:"OTP"}].map(m => (
            <button key={m.id} onClick={() => { setMode(m.id); setError(""); setOtpSent(false); }} style={{ flex:1,padding:9,borderRadius:8,border:"none",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",background:mode===m.id?T.surface:"transparent",color:mode===m.id?T.brand:T.textSub,boxShadow:mode===m.id?"0 1px 4px rgba(0,0,0,.08)":"none",transition:"all 0.2s" }}>{m.label}</button>
          ))}
        </div>

        {error && <div style={{ background:"#FEE2E2",borderRadius:T.radiusSm,padding:"10px 14px",marginBottom:16,fontSize:13,color:T.danger }}>{error}</div>}

        {mode === "password" ? (
          <>
            <Input label="ফোন নম্বর বা ইমেইল" value={ident} onChange={setIdent} placeholder="01XXXXXXXXX বা email@example.com" icon="phone"/>
            <Input label="পাসওয়ার্ড" type="password" value={password} onChange={setPassword} placeholder="পাসওয়ার্ড লিখুন" icon="lock"/>
            <Btn variant="primary" full onClick={loginPassword} disabled={loading}>{loading?"লগইন হচ্ছে...":"🔐 লগইন করুন"}</Btn>
          </>
        ) : !otpSent ? (
          <>
            <Input label="মোবাইল নম্বর" value={phone} onChange={setPhone} placeholder="01XXXXXXXXX" icon="phone" inputMode="tel"/>
            <Btn variant="primary" full onClick={sendOTP} disabled={loading}>{loading?"পাঠানো হচ্ছে...":"📱 OTP পাঠান"}</Btn>
          </>
        ) : (
          <>
            <div style={{ background:`${T.success}12`,borderRadius:T.radiusSm,padding:"10px 14px",marginBottom:16,fontSize:13,color:T.success,fontWeight:600 }}>✅ OTP পাঠানো হয়েছে: {phone}</div>
            <Input label="OTP কোড" value={code} onChange={setCode} placeholder="৬ সংখ্যার কোড" inputMode="numeric" maxLength="6"/>
            <Btn variant="primary" full onClick={loginOTP} disabled={loading}>{loading?"যাচাই হচ্ছে...":"✅ যাচাই করুন"}</Btn>
            <Btn variant="ghost" full onClick={() => setOtpSent(false)} style={{ marginTop:8 }}>← নম্বর পরিবর্তন</Btn>
          </>
        )}

        <Divider label="অথবা"/>
        <p style={{ textAlign:"center",fontSize:14,color:T.textMuted }}>
          নতুন ব্যবহারকারী?{" "}
          <span onClick={onRegister} style={{ color:T.brand,fontWeight:700,cursor:"pointer" }}>রেজিস্ট্রেশন করুন →</span>
        </p>
      </div>
    </div>
  );
}
