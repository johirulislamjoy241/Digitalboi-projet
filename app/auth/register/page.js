"use client";
import { useState, useCallback } from "react";
import { T, BD_DIVISIONS, BD_DISTRICTS, BD_UPAZILAS } from "@/lib/design";
import { Btn, Input, Select, Divider, ProgressBar } from "@/lib/ui";
import { validateBDPhone, passwordStrength, strengthColors, strengthLabels } from "@/lib/helpers";

export default function RegisterPage({ onBack, onComplete }) {
  const [step, setStep]   = useState(1); // 1-5
  const [data, setData]   = useState({
    phone:"", email:"", otp:"",
    ownerName:"", ownerPhoto:null,
    nidFront:null, nidBack:null,
    bizType:"ফিজিক্যাল", bizName:"", bizPhone:"", bizEmail:"",
    division:"", district:"", upazila:"", postcode:"", address:"",
    lat:"", lng:"",
    password:"", confirmPassword:"",
  });
  const [otpSent,  setOtpSent]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const set = useCallback((k, v) => setData(d => ({ ...d, [k]: v })), []);

  const districts = BD_DISTRICTS[data.division] || [];
  const upazilas  = BD_UPAZILAS[data.district]  || [];
  const passStr   = passwordStrength(data.password);

  // ── Step 1: Phone + OTP ──────────────────────────────────────
  const sendOTP = async () => {
    if (!validateBDPhone(data.phone)) return setError("সঠিক বাংলাদেশি নম্বর দিন");
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/otp", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ phone:data.phone, purpose:"register" }) });
      const d = await res.json();
      if (d.success) {
        setOtpSent(true);
        if (d.dev_code) set("otp", d.dev_code);
      } else setError(d.error || "OTP পাঠানো যায়নি");
    } catch { setError("সার্ভার সমস্যা"); }
    setLoading(false);
  };

  const verifyOTP = async () => {
    if (!data.otp || data.otp.length !== 6) return setError("৬ সংখ্যার OTP দিন");
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/otp/verify", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ phone:data.phone, code:data.otp, purpose:"register" }) });
      const d = await res.json();
      if (d.success) { setStep(2); setError(""); }
      else setError(d.error || "OTP সঠিক নয়");
    } catch { setError("সার্ভার সমস্যা"); }
    setLoading(false);
  };

  const next = () => { setError(""); setStep(s => s + 1); };
  const back = () => { setError(""); if (step > 1) setStep(s => s - 1); else onBack(); };

  // ── Final submit ─────────────────────────────────────────────
  const submit = async () => {
    if (!data.password || data.password.length < 6) return setError("কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন");
    if (data.password !== data.confirmPassword) return setError("পাসওয়ার্ড মিলছে না");
    setLoading(true); setError("");
    try {
      const body = new FormData();
      const fields = { phone:data.phone, email:data.email, ownerName:data.ownerName, bizName:data.bizName, bizType:data.bizType, bizPhone:data.bizPhone, bizEmail:data.bizEmail, division:data.division, district:data.district, upazila:data.upazila, postcode:data.postcode, address:data.address, lat:data.lat, lng:data.lng, password:data.password };
      Object.entries(fields).forEach(([k,v]) => { if (v !== null && v !== undefined && v !== "") body.append(k, v); });
      if (data.ownerPhoto) body.append("ownerPhoto", data.ownerPhoto);
      if (data.nidFront)   body.append("nidFront",   data.nidFront);
      if (data.nidBack)    body.append("nidBack",     data.nidBack);

      const res = await fetch("/api/auth/register", { method:"POST", body });
      const d   = await res.json();
      if (d.success) {
        localStorage.setItem("digiboi_token", d.token);
        localStorage.setItem("digiboi_user",  JSON.stringify(d.user));
        onComplete(d.user);
      } else setError(d.error || "রেজিস্ট্রেশন ব্যর্থ");
    } catch (e) { setError("সার্ভার সমস্যা: " + e.message); }
    setLoading(false);
  };

  // ── Step header ──────────────────────────────────────────────
  const STEPS = ["ফোন যাচাই","মালিক তথ্য","NID যাচাই","ব্যবসা তথ্য","পাসওয়ার্ড"];

  return (
    <div style={{ minHeight:"100dvh",background:T.bg,display:"flex",flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:T.brandGrad,padding:"24px 20px" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16 }}>
          <button onClick={back} style={{ background:"rgba(255,255,255,0.2)",border:"none",borderRadius:10,padding:"8px",cursor:"pointer",color:"#fff",display:"flex",alignItems:"center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ color:"#fff",fontWeight:800,fontSize:16 }}>রেজিস্ট্রেশন</div>
        </div>
        {/* Progress */}
        <div style={{ display:"flex",gap:4,marginBottom:8 }}>
          {STEPS.map((_,i) => <div key={i} style={{ flex:1,height:4,borderRadius:2,background:i+1<=step?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.3)",transition:"background 0.3s" }}/>)}
        </div>
        <div style={{ color:"rgba(255,255,255,0.85)",fontSize:13 }}>ধাপ {step}/5 — {STEPS[step-1]}</div>
      </div>

      <div style={{ flex:1,padding:"24px 20px",maxWidth:400,margin:"0 auto",width:"100%" }}>
        {error && <div style={{ background:"#FEE2E2",borderRadius:T.radiusSm,padding:"10px 14px",marginBottom:16,fontSize:13,color:T.danger }}>{error}</div>}

        {/* ── Step 1 ── */}
        {step===1 && (
          <>
            <h3 style={{ fontWeight:800,marginBottom:4 }}>ফোন নম্বর যাচাই</h3>
            <p style={{ color:T.textMuted,fontSize:13,marginBottom:20 }}>আপনার বাংলাদেশি মোবাইল নম্বর দিন</p>
            <Input label="মোবাইল নম্বর *" value={data.phone} onChange={v => set("phone",v)} placeholder="01XXXXXXXXX" inputMode="tel"/>
            <Input label="ইমেইল (ঐচ্ছিক)" value={data.email} onChange={v => set("email",v)} placeholder="email@example.com" type="email"/>
            {!otpSent
              ? <Btn variant="primary" full onClick={sendOTP} disabled={loading}>{loading?"পাঠানো হচ্ছে...":"📱 OTP পাঠান"}</Btn>
              : <>
                  <div style={{ background:`${T.success}12`,borderRadius:T.radiusSm,padding:"10px 14px",marginBottom:12,fontSize:13,color:T.success,fontWeight:600 }}>✅ OTP পাঠানো হয়েছে</div>
                  <Input label="OTP কোড *" value={data.otp} onChange={v => set("otp",v)} placeholder="৬ সংখ্যার কোড" inputMode="numeric"/>
                  <Btn variant="primary" full onClick={verifyOTP} disabled={loading}>{loading?"যাচাই হচ্ছে...":"✅ যাচাই করুন"}</Btn>
                  <Btn variant="ghost" full onClick={() => setOtpSent(false)} style={{ marginTop:8 }}>← পুনরায় পাঠান</Btn>
                </>
            }
          </>
        )}

        {/* ── Step 2: Owner Info ── */}
        {step===2 && (
          <>
            <h3 style={{ fontWeight:800,marginBottom:4 }}>মালিকের তথ্য</h3>
            <p style={{ color:T.textMuted,fontSize:13,marginBottom:20 }}>আপনার ব্যক্তিগত তথ্য দিন</p>
            <Input label="মালিকের নাম *" value={data.ownerName} onChange={v => set("ownerName",v)} placeholder="আপনার পুরো নাম"/>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block",fontSize:12,fontWeight:700,color:T.textSub,marginBottom:8 }}>প্রোফাইল ছবি (ঐচ্ছিক)</label>
              <input type="file" accept="image/*" onChange={e => set("ownerPhoto", e.target.files?.[0]||null)} style={{ width:"100%",padding:"10px",border:`1.5px dashed ${T.border}`,borderRadius:T.radiusSm,fontSize:13,fontFamily:"inherit",cursor:"pointer" }}/>
            </div>
            <Btn variant="primary" full onClick={() => { if (!data.ownerName) return setError("নাম দিন"); next(); }}>পরবর্তী →</Btn>
          </>
        )}

        {/* ── Step 3: NID ── */}
        {step===3 && (
          <>
            <h3 style={{ fontWeight:800,marginBottom:4 }}>NID যাচাইকরণ</h3>
            <p style={{ color:T.textMuted,fontSize:13,marginBottom:20 }}>জাতীয় পরিচয়পত্রের ছবি আপলোড করুন (ঐচ্ছিক)</p>
            {["nidFront","nidBack"].map((field,i) => (
              <div key={field} style={{ marginBottom:14 }}>
                <label style={{ display:"block",fontSize:12,fontWeight:700,color:T.textSub,marginBottom:8 }}>{i===0?"NID সামনের অংশ":"NID পিছনের অংশ"}</label>
                <input type="file" accept="image/*" onChange={e => set(field, e.target.files?.[0]||null)} style={{ width:"100%",padding:"10px",border:`1.5px dashed ${T.border}`,borderRadius:T.radiusSm,fontSize:13,fontFamily:"inherit",cursor:"pointer",boxSizing:"border-box" }}/>
                {data[field] && <div style={{ fontSize:12,color:T.success,marginTop:4 }}>✅ {data[field].name}</div>}
              </div>
            ))}
            <Btn variant="primary" full onClick={next}>পরবর্তী →</Btn>
            <Btn variant="ghost" full onClick={next} style={{ marginTop:8 }}>এড়িয়ে যান</Btn>
          </>
        )}

        {/* ── Step 4: Business Info ── */}
        {step===4 && (
          <>
            <h3 style={{ fontWeight:800,marginBottom:4 }}>ব্যবসার তথ্য</h3>
            <p style={{ color:T.textMuted,fontSize:13,marginBottom:16 }}>আপনার দোকানের তথ্য দিন</p>
            <Input label="দোকানের নাম *" value={data.bizName} onChange={v => set("bizName",v)} placeholder="আপনার দোকানের নাম"/>
            <Select label="ব্যবসার ধরন" value={data.bizType} onChange={v => set("bizType",v)} options={["ফিজিক্যাল","অনলাইন","উভয়"]}/>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
              <Input label="ব্যবসার ফোন" value={data.bizPhone} onChange={v => set("bizPhone",v)} placeholder="01XXXXXXXXX" inputMode="tel"/>
              <Input label="ব্যবসার ইমেইল" value={data.bizEmail} onChange={v => set("bizEmail",v)} placeholder="shop@email.com" type="email"/>
            </div>
            <Select label="বিভাগ" value={data.division} onChange={v => { set("division",v); set("district",""); set("upazila",""); }} options={["", ...BD_DIVISIONS]} placeholder="বিভাগ নির্বাচন"/>
            {districts.length > 0 && <Select label="জেলা" value={data.district} onChange={v => { set("district",v); set("upazila",""); }} options={["", ...districts]} placeholder="জেলা নির্বাচন"/>}
            {upazilas.length > 0  && <Select label="উপজেলা" value={data.upazila} onChange={v => set("upazila",v)} options={["", ...upazilas]} placeholder="উপজেলা নির্বাচন"/>}
            <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr",gap:10 }}>
              <Input label="ঠিকানা" value={data.address} onChange={v => set("address",v)} placeholder="সম্পূর্ণ ঠিকানা"/>
              <Input label="পোস্টকোড" value={data.postcode} onChange={v => set("postcode",v)} placeholder="1000" inputMode="numeric"/>
            </div>
            <Btn variant="primary" full onClick={() => { if (!data.bizName) return setError("দোকানের নাম দিন"); next(); }}>পরবর্তী →</Btn>
          </>
        )}

        {/* ── Step 5: Password ── */}
        {step===5 && (
          <>
            <h3 style={{ fontWeight:800,marginBottom:4 }}>পাসওয়ার্ড তৈরি করুন</h3>
            <p style={{ color:T.textMuted,fontSize:13,marginBottom:20 }}>শক্তিশালী পাসওয়ার্ড দিন</p>
            <Input label="পাসওয়ার্ড *" type="password" value={data.password} onChange={v => set("password",v)} placeholder="কমপক্ষে ৬ অক্ষর" icon="lock"/>
            {data.password && (
              <div style={{ marginBottom:12 }}>
                <ProgressBar value={passStr} max={5} color={strengthColors[passStr-1]||"#ccc"}/>
                <div style={{ fontSize:11,color:strengthColors[passStr-1],marginTop:4,fontWeight:600 }}>{strengthLabels[passStr]}</div>
              </div>
            )}
            <Input label="পাসওয়ার্ড নিশ্চিত করুন *" type="password" value={data.confirmPassword} onChange={v => set("confirmPassword",v)} placeholder="আবার পাসওয়ার্ড লিখুন" icon="lock"/>
            {data.confirmPassword && data.password !== data.confirmPassword && (
              <div style={{ fontSize:12,color:T.danger,marginBottom:8 }}>⚠️ পাসওয়ার্ড মিলছে না</div>
            )}
            <Btn variant="primary" full onClick={submit} disabled={loading} style={{ marginTop:8 }}>
              {loading ? "রেজিস্ট্রেশন হচ্ছে..." : "🎉 রেজিস্ট্রেশন সম্পন্ন করুন"}
            </Btn>
          </>
        )}
      </div>
    </div>
  );
}
