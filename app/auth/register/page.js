"use client";
import { useState, useCallback } from "react";
import { T, BD_DIVISIONS, BD_DISTRICTS, BD_UPAZILAS } from "@/lib/design";
import { Btn, Input, Select } from "@/lib/ui";
import { validateBDPhone, passwordStrength, strengthColors, strengthLabels } from "@/lib/helpers";

export default function RegisterPage({ onBack, onComplete }) {
  const [step, setStep] = useState(1); // 1-4 (OTP step সরানো হয়েছে)
  const [data, setData] = useState({
    phone:"", email:"",
    ownerName:"",
    bizType:"ফিজিক্যাল", bizName:"", bizPhone:"", bizEmail:"",
    division:"", district:"", upazila:"", postcode:"", address:"",
    password:"", confirmPassword:"",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const set = useCallback((k, v) => setData(d => ({ ...d, [k]: v })), []);
  const districts = BD_DISTRICTS[data.division] || [];
  const upazilas  = BD_UPAZILAS[data.district]  || [];
  const passStr   = passwordStrength(data.password);

  const next = () => { setError(""); setStep(s => s + 1); };
  const back = () => { setError(""); if (step > 1) setStep(s => s - 1); else onBack(); };

  const validateStep1 = () => {
    if (!validateBDPhone(data.phone)) { setError("সঠিক বাংলাদেশি নম্বর দিন"); return false; }
    if (!data.ownerName.trim()) { setError("মালিকের নাম দিন"); return false; }
    return true;
  };
  const validateStep2 = () => {
    if (!data.bizName.trim()) { setError("দোকানের নাম দিন"); return false; }
    return true;
  };
  const validateStep3 = () => {
    if (!data.password || data.password.length < 6) { setError("কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন"); return false; }
    if (data.password !== data.confirmPassword) { setError("পাসওয়ার্ড মিলছে না"); return false; }
    return true;
  };

  const submit = async () => {
    if (!validateStep3()) return;
    setLoading(true); setError("");
    try {
      const body = new FormData();
      const fields = {
        phone:data.phone, email:data.email, ownerName:data.ownerName,
        bizName:data.bizName, bizType:data.bizType, bizPhone:data.bizPhone,
        bizEmail:data.bizEmail, division:data.division, district:data.district,
        upazila:data.upazila, postcode:data.postcode, address:data.address,
        password:data.password
      };
      Object.entries(fields).forEach(([k,v]) => { if (v) body.append(k, v); });

      const res = await fetch("/api/auth/register", { method:"POST", body });
      const d   = await res.json();
      if (d.success) {
        localStorage.setItem("digiboi_token", d.token);
        localStorage.setItem("digiboi_user",  JSON.stringify(d.user));
        onComplete(d.user);
      } else setError(d.error || "রেজিস্ট্রেশন ব্যর্থ");
    } catch(e) { setError("সার্ভার সমস্যা: " + e.message); }
    setLoading(false);
  };

  const STEPS = ["ব্যক্তিগত তথ্য","ব্যবসা তথ্য","ঠিকানা","পাসওয়ার্ড"];

  return (
    <div style={{ minHeight:"100dvh", background:T.bg, display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:T.brandGrad, padding:"20px 20px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
          <button onClick={back} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:"8px", cursor:"pointer", color:"#fff", display:"flex" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ color:"#fff", fontWeight:800, fontSize:16 }}>রেজিস্ট্রেশন</div>
        </div>
        <div style={{ display:"flex", gap:4, marginBottom:8 }}>
          {STEPS.map((_,i) => (
            <div key={i} style={{ flex:1, height:4, borderRadius:2, background:i+1<=step?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.3)", transition:"background 0.3s" }}/>
          ))}
        </div>
        <div style={{ color:"rgba(255,255,255,0.85)", fontSize:13 }}>ধাপ {step}/4 — {STEPS[step-1]}</div>
      </div>

      <div style={{ flex:1, padding:"24px 20px", maxWidth:400, margin:"0 auto", width:"100%" }}>
        {error && (
          <div style={{ background:"#FEE2E2", borderRadius:T.radiusSm, padding:"10px 14px", marginBottom:16, fontSize:13, color:T.danger }}>
            {error}
          </div>
        )}

        {/* ── Step 1: ব্যক্তিগত তথ্য ── */}
        {step===1 && (
          <>
            <h3 style={{ fontWeight:800, marginBottom:4 }}>ব্যক্তিগত তথ্য</h3>
            <p style={{ color:T.textMuted, fontSize:13, marginBottom:20 }}>মালিকের তথ্য দিন</p>
            <Input label="মোবাইল নম্বর *" value={data.phone} onChange={v => set("phone",v)} placeholder="01XXXXXXXXX" inputMode="tel"/>
            <Input label="মালিকের নাম *" value={data.ownerName} onChange={v => set("ownerName",v)} placeholder="আপনার পুরো নাম"/>
            <Input label="ইমেইল (ঐচ্ছিক)" value={data.email} onChange={v => set("email",v)} placeholder="email@example.com" type="email"/>
            <Btn variant="primary" full onClick={() => { if(validateStep1()) next(); }}>
              পরবর্তী →
            </Btn>
          </>
        )}

        {/* ── Step 2: ব্যবসা তথ্য ── */}
        {step===2 && (
          <>
            <h3 style={{ fontWeight:800, marginBottom:4 }}>ব্যবসার তথ্য</h3>
            <p style={{ color:T.textMuted, fontSize:13, marginBottom:20 }}>আপনার দোকানের তথ্য দিন</p>
            <Input label="দোকানের নাম *" value={data.bizName} onChange={v => set("bizName",v)} placeholder="দোকানের নাম"/>
            <Select label="ব্যবসার ধরন" value={data.bizType} onChange={v => set("bizType",v)}
              options={["ফিজিক্যাল","অনলাইন","উভয়"]}/>
            <Input label="দোকানের ফোন (ঐচ্ছিক)" value={data.bizPhone} onChange={v => set("bizPhone",v)} placeholder="01XXXXXXXXX" inputMode="tel"/>
            <Input label="দোকানের ইমেইল (ঐচ্ছিক)" value={data.bizEmail} onChange={v => set("bizEmail",v)} placeholder="shop@example.com" type="email"/>
            <Btn variant="primary" full onClick={() => { if(validateStep2()) next(); }}>পরবর্তী →</Btn>
          </>
        )}

        {/* ── Step 3: ঠিকানা ── */}
        {step===3 && (
          <>
            <h3 style={{ fontWeight:800, marginBottom:4 }}>ঠিকানা</h3>
            <p style={{ color:T.textMuted, fontSize:13, marginBottom:20 }}>দোকানের অবস্থান (ঐচ্ছিক)</p>
            <Select label="বিভাগ" value={data.division} onChange={v => { set("division",v); set("district",""); set("upazila",""); }}
              options={["", ...BD_DIVISIONS]}/>
            {districts.length>0 && (
              <Select label="জেলা" value={data.district} onChange={v => { set("district",v); set("upazila",""); }}
                options={["", ...districts]}/>
            )}
            {upazilas.length>0 && (
              <Select label="উপজেলা" value={data.upazila} onChange={v => set("upazila",v)}
                options={["", ...upazilas]}/>
            )}
            <Input label="পোস্টাল কোড (ঐচ্ছিক)" value={data.postcode} onChange={v => set("postcode",v)} placeholder="1200" inputMode="numeric"/>
            <Input label="সম্পূর্ণ ঠিকানা (ঐচ্ছিক)" value={data.address} onChange={v => set("address",v)} placeholder="রোড নম্বর, এলাকা..."/>
            <Btn variant="primary" full onClick={next}>পরবর্তী →</Btn>
          </>
        )}

        {/* ── Step 4: পাসওয়ার্ড ── */}
        {step===4 && (
          <>
            <h3 style={{ fontWeight:800, marginBottom:4 }}>পাসওয়ার্ড তৈরি করুন</h3>
            <p style={{ color:T.textMuted, fontSize:13, marginBottom:20 }}>নিরাপদ পাসওয়ার্ড দিন</p>
            <Input label="পাসওয়ার্ড *" type="password" value={data.password} onChange={v => set("password",v)} placeholder="কমপক্ষে ৬ অক্ষর"/>
            {data.password && (
              <div style={{ marginTop:-8, marginBottom:16 }}>
                <div style={{ height:4, borderRadius:2, background:"#E5E7EB", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${(passStr/4)*100}%`, background:strengthColors[passStr], transition:"all 0.3s" }}/>
                </div>
                <div style={{ fontSize:11, color:strengthColors[passStr], marginTop:4, fontWeight:600 }}>{strengthLabels[passStr]}</div>
              </div>
            )}
            <Input label="পাসওয়ার্ড নিশ্চিত করুন *" type="password" value={data.confirmPassword} onChange={v => set("confirmPassword",v)} placeholder="পাসওয়ার্ড আবার লিখুন"/>
            <Btn variant="primary" full onClick={submit} disabled={loading}>
              {loading ? "রেজিস্ট্রেশন হচ্ছে..." : "✅ রেজিস্ট্রেশন সম্পন্ন করুন"}
            </Btn>
          </>
        )}

        {step < 4 && (
          <Btn variant="ghost" full onClick={back} style={{ marginTop:8 }}>
            ← পেছনে যান
          </Btn>
        )}
      </div>
    </div>
  );
}
