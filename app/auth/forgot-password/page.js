"use client";
import { useState } from "react";
import { T } from "@/lib/design";
import { Btn, Input } from "@/lib/ui";
import { validateBDPhone } from "@/lib/helpers";

export default function ForgotPasswordPage({ onBack, onDone }) {
  const [phone,    setPhone]    = useState("");
  const [newPass,  setNewPass]  = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  // সরাসরি পাসওয়ার্ড রিসেট (OTP ছাড়া — admin approve করে)
  const submit = async () => {
    if (!validateBDPhone(phone)) return setError("সঠিক বাংলাদেশি নম্বর দিন");
    if (!newPass || newPass.length < 6) return setError("কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন");
    if (newPass !== confirm) return setError("পাসওয়ার্ড মিলছে না");
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, newPassword: newPass })
      });
      const d = await res.json();
      if (d.success) { setSuccess(true); }
      else setError(d.error || "পাসওয়ার্ড রিসেট ব্যর্থ");
    } catch { setError("সার্ভার সমস্যা"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100dvh", background:T.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ background:T.brandGrad, padding:"48px 32px 40px", textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:10 }}>🔑</div>
        <div style={{ color:"#fff", fontWeight:800, fontSize:24 }}>পাসওয়ার্ড রিসেট</div>
        <div style={{ color:"rgba(255,255,255,0.8)", fontSize:13, marginTop:6 }}>নতুন পাসওয়ার্ড সেট করুন</div>
      </div>

      <div style={{ flex:1, padding:"32px 24px", maxWidth:400, margin:"0 auto", width:"100%" }}>
        {success ? (
          <div style={{ textAlign:"center", padding:"32px 0" }}>
            <div style={{ fontSize:56, marginBottom:16 }}>✅</div>
            <h3 style={{ fontWeight:800, color:T.text }}>পাসওয়ার্ড পরিবর্তন হয়েছে!</h3>
            <p style={{ color:T.textMuted, fontSize:14, marginBottom:24 }}>নতুন পাসওয়ার্ড দিয়ে লগইন করুন</p>
            <Btn variant="primary" full onClick={onDone}>লগইনে যান →</Btn>
          </div>
        ) : (
          <>
            <h2 style={{ fontWeight:800, fontSize:22, color:T.text, marginBottom:6 }}>নতুন পাসওয়ার্ড</h2>
            <p style={{ color:T.textMuted, fontSize:13, marginBottom:24 }}>রেজিস্ট্রেশন করা ফোন নম্বর দিয়ে পাসওয়ার্ড পরিবর্তন করুন</p>

            {error && (
              <div style={{ background:"#FEE2E2", borderRadius:T.radiusSm, padding:"10px 14px", marginBottom:16, fontSize:13, color:T.danger }}>
                {error}
              </div>
            )}

            <Input label="মোবাইল নম্বর *" value={phone} onChange={setPhone} placeholder="01XXXXXXXXX" inputMode="tel"/>
            <Input label="নতুন পাসওয়ার্ড *" type="password" value={newPass} onChange={setNewPass} placeholder="কমপক্ষে ৬ অক্ষর"/>
            <Input label="পাসওয়ার্ড নিশ্চিত করুন *" type="password" value={confirm} onChange={setConfirm} placeholder="পাসওয়ার্ড আবার লিখুন"/>

            <Btn variant="primary" full onClick={submit} disabled={loading}>
              {loading ? "আপডেট হচ্ছে..." : "🔐 পাসওয়ার্ড পরিবর্তন করুন"}
            </Btn>
            <Btn variant="ghost" full onClick={onBack} style={{ marginTop:8 }}>← লগইনে ফিরুন</Btn>
          </>
        )}
      </div>
    </div>
  );
}
