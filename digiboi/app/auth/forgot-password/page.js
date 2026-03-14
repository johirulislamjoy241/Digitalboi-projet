"use client";
import { useState } from "react";
import { T } from "@/lib/design";
import { Btn, Input } from "@/lib/ui";
import { validateBDPhone, passwordStrength, strengthColors, strengthLabels } from "@/lib/helpers";

export default function ForgotPasswordPage({ onBack, onDone }) {
  const [step,     setStep]     = useState(1); // 1=phone, 2=secret question, 3=new password
  const [phone,    setPhone]    = useState("");
  const [shopName, setShopName] = useState("");
  const [newPass,  setNewPass]  = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [hint,     setHint]     = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);
  const passStr = passwordStrength(newPass);

  // Step 1: Phone verify
  const verifyPhone = async () => {
    if (!validateBDPhone(phone)) return setError("সঠিক বাংলাদেশি নম্বর দিন");
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ step:1, phone })
      });
      const d = await res.json();
      if (d.success) { setHint(d); setStep(2); }
      else setError(d.error || "যাচাই ব্যর্থ");
    } catch { setError("সার্ভার সমস্যা"); }
    setLoading(false);
  };

  // Step 2: Answer secret question
  const verifySecret = async () => {
    if (!shopName.trim()) return setError("দোকানের নাম দিন");
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ step:2, phone, shopName })
      });
      const d = await res.json();
      if (d.success) setStep(3);
      else setError(d.error || "উত্তর সঠিক নয়");
    } catch { setError("সার্ভার সমস্যা"); }
    setLoading(false);
  };

  // Step 3: Set new password
  const setPassword = async () => {
    if (!newPass || newPass.length < 6) return setError("কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন");
    if (newPass !== confirm) return setError("পাসওয়ার্ড মিলছে না");
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ step:3, phone, shopName, newPassword:newPass })
      });
      const d = await res.json();
      if (d.success) setSuccess(true);
      else setError(d.error || "পাসওয়ার্ড পরিবর্তন ব্যর্থ");
    } catch { setError("সার্ভার সমস্যা"); }
    setLoading(false);
  };

  const STEPS = ["ফোন যাচাই","পরিচয় নিশ্চিত","নতুন পাসওয়ার্ড"];

  return (
    <div style={{ minHeight:"100dvh", background:T.bg, display:"flex", flexDirection:"column" }}>
      <div style={{ background:T.brandGrad, padding:"36px 24px 28px", textAlign:"center" }}>
        <div style={{ fontSize:44, marginBottom:10 }}>🔑</div>
        <div style={{ color:"#fff", fontWeight:800, fontSize:22 }}>পাসওয়ার্ড রিসেট</div>
        <div style={{ color:"rgba(255,255,255,0.8)", fontSize:13, marginTop:4 }}>নিরাপদে পাসওয়ার্ড পরিবর্তন করুন</div>
        {/* Step indicator */}
        {!success && (
          <div style={{ display:"flex", gap:4, marginTop:16, justifyContent:"center" }}>
            {STEPS.map((_,i) => (
              <div key={i} style={{ height:4, width:60, borderRadius:2, background:i+1<=step?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.3)", transition:"background 0.3s" }}/>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex:1, padding:"28px 24px", maxWidth:400, margin:"0 auto", width:"100%", boxSizing:"border-box" }}>
        {success ? (
          <div style={{ textAlign:"center", padding:"32px 0" }}>
            <div style={{ fontSize:56, marginBottom:16 }}>✅</div>
            <h3 style={{ fontWeight:800, color:T.text }}>পাসওয়ার্ড পরিবর্তন হয়েছে!</h3>
            <p style={{ color:T.textMuted, fontSize:14, marginBottom:24 }}>নতুন পাসওয়ার্ড দিয়ে লগইন করুন</p>
            <Btn variant="primary" full onClick={onDone}>লগইনে যান →</Btn>
          </div>
        ) : (
          <>
            {/* Step header */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:12, color:T.brand, fontWeight:700, marginBottom:4 }}>ধাপ {step}/3</div>
              <h2 style={{ fontWeight:800, fontSize:20, color:T.text, margin:0 }}>{STEPS[step-1]}</h2>
            </div>

            {error && (
              <div style={{ background:"#FEE2E2", borderRadius:T.radiusSm, padding:"10px 14px", marginBottom:16, fontSize:13, color:T.danger }}>
                ⚠️ {error}
              </div>
            )}

            {/* Step 1 */}
            {step===1 && (
              <>
                <p style={{ color:T.textMuted, fontSize:13, marginBottom:20 }}>
                  রেজিস্ট্রেশন করা মোবাইল নম্বর দিন। আমরা আপনার পরিচয় যাচাই করব।
                </p>
                <Input label="মোবাইল নম্বর *" value={phone} onChange={setPhone} placeholder="01XXXXXXXXX" inputMode="tel"/>
                <Btn variant="primary" full onClick={verifyPhone} disabled={loading}>
                  {loading ? "যাচাই হচ্ছে..." : "পরবর্তী →"}
                </Btn>
              </>
            )}

            {/* Step 2 */}
            {step===2 && (
              <>
                {hint && (
                  <div style={{ background:`${T.brand}08`, borderRadius:T.radiusSm, padding:"12px 14px", marginBottom:16, border:`1px solid ${T.brand}20` }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.brand, marginBottom:4 }}>👤 অ্যাকাউন্ট পাওয়া গেছে</div>
                    <div style={{ fontSize:13, color:T.textSub }}>মালিক: <strong>{hint.maskedName}</strong></div>
                  </div>
                )}
                <p style={{ color:T.textMuted, fontSize:13, marginBottom:16 }}>
                  🔐 নিরাপত্তার জন্য আপনার দোকানের নাম দিয়ে পরিচয় নিশ্চিত করুন।
                </p>
                <Input label="আপনার দোকানের নাম *" value={shopName} onChange={setShopName} placeholder="রেজিস্ট্রেশনে দেওয়া দোকানের নাম"/>
                <div style={{ background:`${T.warning}10`, borderRadius:T.radiusSm, padding:"10px 14px", marginBottom:16, border:`1px solid ${T.warning}30`, fontSize:12, color:T.textSub }}>
                  💡 <strong>টিপস:</strong> রেজিস্ট্রেশনের সময় যে দোকানের নাম দিয়েছিলেন সেটি হুবহু লিখুন।
                </div>
                <Btn variant="primary" full onClick={verifySecret} disabled={loading}>
                  {loading ? "যাচাই হচ্ছে..." : "পরিচয় নিশ্চিত করুন →"}
                </Btn>
                <Btn variant="ghost" full onClick={() => { setStep(1); setError(""); }} style={{ marginTop:8 }}>← পেছনে</Btn>
              </>
            )}

            {/* Step 3 */}
            {step===3 && (
              <>
                <p style={{ color:T.textMuted, fontSize:13, marginBottom:16 }}>
                  ✅ পরিচয় নিশ্চিত হয়েছে। এখন নতুন পাসওয়ার্ড দিন।
                </p>
                <div style={{ background:`${T.success}10`, borderRadius:T.radiusSm, padding:"10px 14px", marginBottom:16, border:`1px solid ${T.success}30`, fontSize:12, color:T.success, fontWeight:600 }}>
                  🔓 পরিচয় যাচাই সম্পন্ন
                </div>
                <Input label="নতুন পাসওয়ার্ড *" type="password" value={newPass} onChange={setNewPass} placeholder="কমপক্ষে ৬ অক্ষর"/>
                {newPass && (
                  <div style={{ marginTop:-8, marginBottom:16 }}>
                    <div style={{ height:4, borderRadius:2, background:"#E5E7EB", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${(passStr/4)*100}%`, background:strengthColors[passStr], transition:"all 0.3s" }}/>
                    </div>
                    <div style={{ fontSize:11, color:strengthColors[passStr], marginTop:4, fontWeight:600 }}>{strengthLabels[passStr]}</div>
                  </div>
                )}
                <Input label="পাসওয়ার্ড নিশ্চিত করুন *" type="password" value={confirm} onChange={setConfirm} placeholder="পাসওয়ার্ড আবার লিখুন"/>
                <Btn variant="primary" full onClick={setPassword} disabled={loading}>
                  {loading ? "আপডেট হচ্ছে..." : "🔐 পাসওয়ার্ড পরিবর্তন করুন"}
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
