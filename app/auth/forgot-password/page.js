"use client";
import { useState } from "react";
import { T } from "@/lib/design";
import { Btn, Input } from "@/lib/ui";
import { validateBDPhone, passwordStrength, strengthColors, strengthLabels } from "@/lib/helpers";

export default function ForgotPasswordPage({ onBack, onDone }) {
  const [step,       setStep]       = useState(1);
  const [phone,      setPhone]      = useState("");
  const [methods,    setMethods]    = useState([]);
  const [maskedName, setMaskedName] = useState("");
  const [method,     setMethod]     = useState(""); // "shop" | "recovery"
  const [shopName,   setShopName]   = useState("");
  const [recCode,    setRecCode]    = useState("");
  const [newPass,    setNewPass]    = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState(false);
  const passStr = passwordStrength(newPass);

  const call = async (body) => {
    const res = await fetch("/api/auth/forgot-password", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(body)
    });
    return res.json();
  };

  // Step 1: verify phone
  const step1 = async () => {
    if (!validateBDPhone(phone)) return setError("সঠিক বাংলাদেশি নম্বর দিন");
    setLoading(true); setError("");
    const d = await call({ step:1, phone }).catch(()=>({success:false,error:"সার্ভার সমস্যা"}));
    setLoading(false);
    if (d.success) {
      setMaskedName(d.maskedName);
      setMethods(d.methods||["shop"]);
      setMethod(d.methods?.includes("recovery") ? "" : "shop");
      setStep(2);
    } else setError(d.error||"যাচাই ব্যর্থ");
  };

  // Step 2: choose & verify method
  const step2 = async () => {
    if (!method) return setError("পদ্ধতি নির্বাচন করুন");
    setLoading(true); setError("");
    let stepId = method==="recovery" ? "2b" : "2a";
    const body = { step:stepId, phone };
    if (method==="shop")     body.shopName    = shopName;
    if (method==="recovery") body.recoveryCode = recCode;
    const d = await call(body).catch(()=>({success:false,error:"সার্ভার সমস্যা"}));
    setLoading(false);
    if (d.success) setStep(3);
    else setError(d.error||"যাচাই ব্যর্থ");
  };

  // Step 3: set new password
  const step3 = async () => {
    if (!newPass||newPass.length<6) return setError("কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন");
    if (newPass!==confirm) return setError("পাসওয়ার্ড মিলছে না");
    setLoading(true); setError("");
    const body = { step:3, phone, newPassword:newPass };
    if (method==="shop")     body.shopName    = shopName;
    if (method==="recovery") body.recoveryCode = recCode;
    const d = await call(body).catch(()=>({success:false,error:"সার্ভার সমস্যা"}));
    setLoading(false);
    if (d.success) setSuccess(true);
    else setError(d.error||"পাসওয়ার্ড পরিবর্তন ব্যর্থ");
  };

  const STEPS = ["ফোন যাচাই","পরিচয় নিশ্চিত","নতুন পাসওয়ার্ড"];

  return (
    <div style={{ minHeight:"100dvh",background:T.bg,display:"flex",flexDirection:"column" }}>
      <div style={{ background:T.brandGrad,padding:"36px 24px 28px",textAlign:"center" }}>
        <div style={{ fontSize:44,marginBottom:10 }}>🔑</div>
        <div style={{ color:"#fff",fontWeight:800,fontSize:22 }}>পাসওয়ার্ড রিসেট</div>
        {!success && (
          <div style={{ display:"flex",gap:4,marginTop:16,justifyContent:"center" }}>
            {STEPS.map((_,i)=>(
              <div key={i} style={{ height:4,width:60,borderRadius:2,background:i+1<=step?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.3)",transition:"background 0.3s" }}/>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex:1,padding:"28px 24px",maxWidth:400,margin:"0 auto",width:"100%",boxSizing:"border-box" }}>
        {success ? (
          <div style={{ textAlign:"center",padding:"32px 0" }}>
            <div style={{ fontSize:56,marginBottom:16 }}>✅</div>
            <h3 style={{ fontWeight:800 }}>পাসওয়ার্ড পরিবর্তন হয়েছে!</h3>
            <p style={{ color:T.textMuted,fontSize:14,marginBottom:24 }}>নতুন পাসওয়ার্ড দিয়ে লগইন করুন</p>
            <Btn variant="primary" full onClick={onDone}>লগইনে যান →</Btn>
          </div>
        ) : (
          <>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:12,color:T.brand,fontWeight:700,marginBottom:4 }}>ধাপ {step}/3 — {STEPS[step-1]}</div>
            </div>
            {error && (
              <div style={{ background:"#FEE2E2",borderRadius:T.radiusSm,padding:"10px 14px",marginBottom:16,fontSize:13,color:T.danger }}>
                ⚠️ {error}
              </div>
            )}

            {/* Step 1 */}
            {step===1 && (
              <>
                <p style={{ color:T.textMuted,fontSize:13,marginBottom:20 }}>রেজিস্ট্রেশন করা মোবাইল নম্বর দিন।</p>
                <Input label="মোবাইল নম্বর *" value={phone} onChange={setPhone} placeholder="01XXXXXXXXX" inputMode="tel"/>
                <Btn variant="primary" full onClick={step1} disabled={loading}>{loading?"যাচাই হচ্ছে...":"পরবর্তী →"}</Btn>
              </>
            )}

            {/* Step 2 */}
            {step===2 && (
              <>
                <div style={{ background:`${T.brand}08`,borderRadius:T.radiusSm,padding:"12px 14px",marginBottom:16,border:`1px solid ${T.brand}20` }}>
                  <div style={{ fontSize:12,fontWeight:700,color:T.brand,marginBottom:4 }}>👤 অ্যাকাউন্ট পাওয়া গেছে</div>
                  <div style={{ fontSize:13,color:T.textSub }}>মালিক: <strong>{maskedName}</strong></div>
                </div>

                {/* Method selector — only if recovery code available */}
                {methods.includes("recovery") && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:12,fontWeight:700,color:T.textSub,marginBottom:8 }}>পরিচয় যাচাইয়ের পদ্ধতি বেছে নিন:</div>
                    <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
                      {[
                        {id:"shop",    label:"🏪 দোকানের নাম"},
                        {id:"recovery",label:"🔑 রিকভারি কোড"},
                      ].map(m=>(
                        <button key={m.id} onClick={()=>setMethod(m.id)}
                          style={{ padding:"10px 8px",borderRadius:T.radiusSm,border:`2px solid ${method===m.id?T.brand:T.border}`,background:method===m.id?`${T.brand}10`:"transparent",fontWeight:700,fontSize:13,color:method===m.id?T.brand:T.textSub,cursor:"pointer",fontFamily:"inherit" }}>
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(method==="shop"||!methods.includes("recovery")) && (
                  <>
                    <p style={{ color:T.textMuted,fontSize:13,marginBottom:12 }}>🔐 রেজিস্ট্রেশনে দেওয়া দোকানের নাম হুবহু লিখুন।</p>
                    <Input label="দোকানের নাম *" value={shopName} onChange={setShopName} placeholder="আপনার দোকানের নাম"/>
                  </>
                )}
                {method==="recovery" && (
                  <>
                    <p style={{ color:T.textMuted,fontSize:13,marginBottom:12 }}>🔑 রেজিস্ট্রেশনে দেওয়া ৬ সংখ্যার রিকভারি কোড দিন।</p>
                    <Input label="রিকভারি কোড *" value={recCode} onChange={v=>setRecCode(v.replace(/\D/g,"").slice(0,6))} placeholder="123456" inputMode="numeric"/>
                  </>
                )}

                <Btn variant="primary" full onClick={step2} disabled={loading||!method}>{loading?"যাচাই হচ্ছে...":"পরিচয় নিশ্চিত করুন →"}</Btn>
                <Btn variant="ghost" full onClick={()=>{setStep(1);setError("");}} style={{ marginTop:8 }}>← পেছনে</Btn>
              </>
            )}

            {/* Step 3 */}
            {step===3 && (
              <>
                <div style={{ background:`${T.success}10`,borderRadius:T.radiusSm,padding:"10px 14px",marginBottom:16,border:`1px solid ${T.success}30`,fontSize:13,color:T.success,fontWeight:600 }}>
                  🔓 পরিচয় যাচাই সম্পন্ন
                </div>
                <Input label="নতুন পাসওয়ার্ড *" type="password" value={newPass} onChange={setNewPass} placeholder="কমপক্ষে ৬ অক্ষর"/>
                {newPass && (
                  <div style={{ marginTop:-8,marginBottom:16 }}>
                    <div style={{ height:4,borderRadius:2,background:"#E5E7EB",overflow:"hidden" }}>
                      <div style={{ height:"100%",width:`${(passStr/4)*100}%`,background:strengthColors[passStr],transition:"all 0.3s" }}/>
                    </div>
                    <div style={{ fontSize:11,color:strengthColors[passStr],marginTop:4,fontWeight:600 }}>{strengthLabels[passStr]}</div>
                  </div>
                )}
                <Input label="পাসওয়ার্ড নিশ্চিত করুন *" type="password" value={confirm} onChange={setConfirm} placeholder="পাসওয়ার্ড আবার লিখুন"/>
                <Btn variant="primary" full onClick={step3} disabled={loading}>{loading?"আপডেট হচ্ছে...":"🔐 পাসওয়ার্ড পরিবর্তন করুন"}</Btn>
              </>
            )}

            <Btn variant="ghost" full onClick={onBack} style={{ marginTop:8 }}>← লগইনে ফিরুন</Btn>
          </>
        )}
      </div>
    </div>
  );
}
