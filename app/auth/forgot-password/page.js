"use client";
import { useState } from "react";
import { T } from "@/lib/design";
import { Btn } from "@/lib/ui";
import { validateBDPhone, passwordStrength, strengthColors, strengthLabels } from "@/lib/helpers";

const inputStyle = (extra={}) => ({
  width:"100%", padding:"12px 14px",
  border:`1.5px solid ${T.border}`, borderRadius:T.radiusSm,
  fontSize:14, fontFamily:"inherit", outline:"none",
  boxSizing:"border-box", background:"#fff", color:"#1a1a1a",
  marginBottom:14, display:"block", ...extra
});

export default function ForgotPasswordPage({ onBack, onDone }) {
  const [step,     setStep]    = useState(1); // 1=phone, 2=recovery code + new password
  const [phone,    setPhone]   = useState("");
  const [maskedName,setMasked] = useState("");
  const [recCode,  setRecCode] = useState("");
  const [newPass,  setNewPass] = useState("");
  const [confirm,  setConfirm] = useState("");
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState("");
  const [success,  setSuccess] = useState(false);
  const passStr = passwordStrength(newPass);

  // Step 1: verify phone exists
  const checkPhone = async () => {
    if (!validateBDPhone(phone)) return setError("সঠিক বাংলাদেশি নম্বর দিন");
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ step:1, phone })
      });
      const d = await res.json();
      if (d.success) { setMasked(d.maskedName||""); setStep(2); }
      else setError(d.error || "নম্বর যাচাই ব্যর্থ");
    } catch { setError("সার্ভার সমস্যা"); }
    setLoading(false);
  };

  // Step 2: verify recovery code + set new password
  const resetPassword = async () => {
    if (!recCode || recCode.length !== 6 || !/^\d{6}$/.test(recCode))
      return setError("৬ সংখ্যার রিকভারি কোড দিন");
    if (!newPass || newPass.length < 6)
      return setError("কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন");
    if (newPass !== confirm)
      return setError("পাসওয়ার্ড মিলছে না");

    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ step:3, phone, recoveryCode:recCode, newPassword:newPass })
      });
      const d = await res.json();
      if (d.success) setSuccess(true);
      else setError(d.error || "পাসওয়ার্ড পরিবর্তন ব্যর্থ");
    } catch { setError("সার্ভার সমস্যা"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100dvh", background:T.bg, display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:T.brandGrad, padding:"40px 24px 32px", textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:10 }}>🔑</div>
        <div style={{ color:"#fff", fontWeight:800, fontSize:22 }}>পাসওয়ার্ড রিসেট</div>
        <div style={{ color:"rgba(255,255,255,0.8)", fontSize:13, marginTop:4 }}>রিকভারি কোড দিয়ে নিরাপদে পরিবর্তন করুন</div>
        {!success && (
          <div style={{ display:"flex", gap:4, marginTop:16, justifyContent:"center" }}>
            {[1,2].map(i=>(
              <div key={i} style={{ height:4, width:70, borderRadius:2, background:i<=step?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.3)", transition:"background 0.3s" }}/>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex:1, padding:"28px 24px", maxWidth:400, margin:"0 auto", width:"100%", boxSizing:"border-box" }}>
        {success ? (
          <div style={{ textAlign:"center", padding:"32px 0" }}>
            <div style={{ fontSize:60, marginBottom:16 }}>✅</div>
            <h3 style={{ fontWeight:800, color:T.text, fontSize:20 }}>পাসওয়ার্ড পরিবর্তন হয়েছে!</h3>
            <p style={{ color:T.textMuted, fontSize:14, marginBottom:24 }}>নতুন পাসওয়ার্ড দিয়ে লগইন করুন</p>
            <Btn variant="primary" full onClick={onDone}>লগইনে যান →</Btn>
          </div>
        ) : (
          <>
            {error && (
              <div style={{ background:"#FEE2E2", borderRadius:T.radiusSm, padding:"10px 14px", marginBottom:16, fontSize:13, color:T.danger, display:"flex", gap:8 }}>
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            {/* ── Step 1: ফোন নম্বর ── */}
            {step===1 && (
              <>
                <h2 style={{ fontWeight:800, fontSize:20, marginBottom:8 }}>মোবাইল নম্বর যাচাই</h2>
                <p style={{ color:T.textMuted, fontSize:13, marginBottom:20 }}>
                  রেজিস্ট্রেশন করা মোবাইল নম্বর দিন। তারপর রিকভারি কোড দিয়ে পাসওয়ার্ড পরিবর্তন করুন।
                </p>
                <label style={{ display:"block", fontSize:12, fontWeight:700, color:T.textSub, marginBottom:6 }}>
                  মোবাইল নম্বর <span style={{ color:T.danger }}>*</span>
                </label>
                <input value={phone} onChange={e=>setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX" inputMode="tel"
                  style={inputStyle()}/>
                <Btn variant="primary" full onClick={checkPhone} disabled={loading}>
                  {loading ? "যাচাই হচ্ছে..." : "পরবর্তী →"}
                </Btn>
              </>
            )}

            {/* ── Step 2: Recovery Code + New Password ── */}
            {step===2 && (
              <>
                <h2 style={{ fontWeight:800, fontSize:20, marginBottom:8 }}>পাসওয়ার্ড পরিবর্তন</h2>

                {maskedName && (
                  <div style={{ background:`${T.brand}08`, borderRadius:T.radiusSm, padding:"10px 14px", marginBottom:16, border:`1px solid ${T.brand}20` }}>
                    <div style={{ fontSize:12, color:T.textSub }}>
                      অ্যাকাউন্ট পাওয়া গেছে: <strong>{maskedName}</strong>
                    </div>
                  </div>
                )}

                {/* Recovery Code */}
                <div style={{ background:`${T.warning}08`, borderRadius:T.radiusSm, padding:"14px", marginBottom:16, border:`1px solid ${T.warning}30` }}>
                  <div style={{ fontSize:12, fontWeight:800, color:T.warning, marginBottom:8 }}>
                    🔑 রিকভারি কোড <span style={{ color:T.danger }}>*</span>
                  </div>
                  <p style={{ fontSize:12, color:T.textSub, marginBottom:10, lineHeight:1.5 }}>
                    রেজিস্ট্রেশনের সময় দেওয়া <strong>৬ সংখ্যার রিকভারি কোড</strong> দিন।
                    এই কোড ছাড়া পাসওয়ার্ড পরিবর্তন সম্ভব নয়।
                  </p>
                  <input
                    value={recCode}
                    onChange={e=>setRecCode(e.target.value.replace(/\D/g,"").slice(0,6))}
                    placeholder="• • • • • •"
                    inputMode="numeric"
                    maxLength={6}
                    style={inputStyle({
                      fontSize:24, letterSpacing:10, textAlign:"center", fontWeight:800,
                      border:`2px solid ${recCode.length===6?T.success:T.warning}`,
                      marginBottom:4
                    })}
                  />
                  {recCode.length===6
                    ? <div style={{ fontSize:11, color:T.success, fontWeight:600 }}>✅ কোড সম্পূর্ণ</div>
                    : recCode.length>0
                    ? <div style={{ fontSize:11, color:T.warning }}>⚠️ {6-recCode.length}টি সংখ্যা আরো দিন</div>
                    : null
                  }
                </div>

                {/* New Password */}
                <label style={{ display:"block", fontSize:12, fontWeight:700, color:T.textSub, marginBottom:6 }}>
                  নতুন পাসওয়ার্ড <span style={{ color:T.danger }}>*</span>
                </label>
                <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)}
                  placeholder="কমপক্ষে ৬ অক্ষর"
                  style={inputStyle()}/>
                {newPass && (
                  <div style={{ marginTop:-10, marginBottom:14 }}>
                    <div style={{ height:4, borderRadius:2, background:"#E5E7EB", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${(passStr/4)*100}%`, background:strengthColors[passStr], transition:"all 0.3s" }}/>
                    </div>
                    <div style={{ fontSize:11, color:strengthColors[passStr], marginTop:4, fontWeight:600 }}>{strengthLabels[passStr]}</div>
                  </div>
                )}

                <label style={{ display:"block", fontSize:12, fontWeight:700, color:T.textSub, marginBottom:6 }}>
                  পাসওয়ার্ড নিশ্চিত করুন <span style={{ color:T.danger }}>*</span>
                </label>
                <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
                  placeholder="পাসওয়ার্ড আবার লিখুন"
                  style={inputStyle()}/>

                <Btn variant="primary" full onClick={resetPassword} disabled={loading}>
                  {loading ? "আপডেট হচ্ছে..." : "🔐 পাসওয়ার্ড পরিবর্তন করুন"}
                </Btn>
                <Btn variant="ghost" full onClick={()=>{setStep(1);setError("");}} style={{ marginTop:8 }}>
                  ← পেছনে
                </Btn>
              </>
            )}

            <Btn variant="ghost" full onClick={onBack} style={{ marginTop:8 }}>← লগইনে ফিরুন</Btn>
          </>
        )}
      </div>
    </div>
  );
}
