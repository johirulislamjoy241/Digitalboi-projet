"use client";
import { useState, useCallback } from "react";
import { T } from "@/lib/design";
import { Btn, Input, Select } from "@/lib/ui";
import { validateBDPhone, passwordStrength, strengthColors, strengthLabels } from "@/lib/helpers";
import { DIVISIONS, DISTRICTS, UPAZILAS, UNIONS } from "@/lib/bd-locations";

const SHOP_CATEGORIES = [
  "মুদি দোকান","ঔষধ ফার্মেসি","কাপড় বস্ত্র","ইলেকট্রনিক্স","মোবাইল আনুষাঙ্গিক",
  "রেস্তোরাঁ ফুড","বেকারি মিষ্টি","চা স্টল","সবজি তরকারি","মাছ মাংস",
  "জুতা চামড়া","কসমেটিক্স সৌন্দর্য","হার্ডওয়ার নির্মাণ","স্টেশনারি বই",
  "আসবাবপত্র","গ্যারেজ মোটর","কৃষি বীজ","পোল্ট্রি মৎস্য","অনলাইন শপ","অন্যান্য"
];

// ── Required field label ──
function Label({ text, required }) {
  return (
    <label style={{ display:"block",fontSize:12,fontWeight:700,color:T.textSub,marginBottom:6 }}>
      {text}{required && <span style={{ color:T.danger,marginLeft:2 }}>*</span>}
    </label>
  );
}

// ── Custom Input with required ──
function Field({ label, required, children, helper }) {
  return (
    <div style={{ marginBottom:14 }}>
      <Label text={label} required={required}/>
      {children}
      {helper && <div style={{ fontSize:11,color:T.textMuted,marginTop:4 }}>{helper}</div>}
    </div>
  );
}

export default function RegisterPage({ onBack, onComplete }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    // Step 1 — ব্যক্তিগত
    phone:"", email:"", ownerName:"", ownerDob:"", ownerGender:"পুরুষ",
    // Step 2 — ব্যবসা
    bizType:"ফিজিক্যাল", bizName:"", bizCategory:"মুদি দোকান",
    bizPhone:"", bizEmail:"", bizWebsite:"", bizSocial:"", tradeLicense:"",
    // Step 3 — ঠিকানা
    division:"", district:"", upazila:"", union:"", village:"", address:"",
    lat:"", lng:"",
    // Step 4 — পাসওয়ার্ড
    password:"", confirmPassword:"", recoveryCode:"",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const set = useCallback((k, v) => setData(d => ({ ...d, [k]: v })), []);

  const districts = DISTRICTS[data.division] || [];
  const upazilas  = UPAZILAS[data.district]  || [];
  const unions    = UNIONS[data.upazila]     || [];
  const passStr   = passwordStrength(data.password);

  const next = () => { setError(""); setStep(s => s + 1); };
  const back = () => { setError(""); if (step > 1) setStep(s => s - 1); else onBack(); };

  // ── Validation ──
  const v1 = () => {
    if (!validateBDPhone(data.phone))    { setError("সঠিক বাংলাদেশি নম্বর দিন (01XXXXXXXXX)"); return false; }
    if (!data.ownerName.trim())          { setError("মালিকের পুরো নাম দিন"); return false; }
    if (!data.ownerDob.trim())           { setError("জন্ম তারিখ দিন"); return false; }
    if (!data.ownerGender)               { setError("লিঙ্গ নির্বাচন করুন"); return false; }
    return true;
  };
  const v2 = () => {
    if (!data.bizName.trim())   { setError("দোকানের নাম দিন"); return false; }
    if (!data.bizCategory)      { setError("দোকানের ক্যাটাগরি নির্বাচন করুন"); return false; }
    if (!data.bizType)          { setError("ব্যবসার ধরন নির্বাচন করুন"); return false; }
    return true;
  };
  const v3 = () => {
    if (!data.division)  { setError("বিভাগ নির্বাচন করুন"); return false; }
    if (!data.district)  { setError("জেলা নির্বাচন করুন"); return false; }
    if (!data.upazila)   { setError("উপজেলা নির্বাচন করুন"); return false; }
    if (!data.union)     { setError("ইউনিয়ন/পৌরসভা নির্বাচন করুন"); return false; }
    if (!data.village.trim())  { setError("গ্রাম / এলাকা / মহল্লা লিখুন"); return false; }
    if (!data.address.trim())  { setError("নির্দিষ্ট ঠিকানা / বাড়ি নম্বর লিখুন"); return false; }
    return true;
  };
  const v4 = () => {
    if (!data.password || data.password.length < 6) { setError("কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন"); return false; }
    if (data.password !== data.confirmPassword)     { setError("পাসওয়ার্ড মিলছে না"); return false; }
    if (!data.recoveryCode || data.recoveryCode.length !== 6 || !/^\d{6}$/.test(data.recoveryCode)) {
      setError("৬ সংখ্যার রিকভারি কোড অবশ্যই দিতে হবে (শুধু সংখ্যা)"); return false;
    }
    return true;
  };

  const submit = async () => {
    if (!v4()) return;
    setLoading(true); setError("");
    try {
      const body = new FormData();
      const fields = {
        phone:data.phone, email:data.email, ownerName:data.ownerName,
        ownerDob:data.ownerDob, ownerGender:data.ownerGender,
        bizName:data.bizName, bizType:data.bizType, bizCategory:data.bizCategory,
        bizPhone:data.bizPhone, bizEmail:data.bizEmail,
        bizWebsite:data.bizWebsite, bizSocial:data.bizSocial, tradeLicense:data.tradeLicense,
        division:data.division, district:data.district, upazila:data.upazila,
        union:data.union, village:data.village, address:data.address,
        lat:data.lat, lng:data.lng,
        password:data.password, recoveryCode:data.recoveryCode
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

  const inputStyle = {
    width:"100%", padding:"10px 12px",
    border:`1.5px solid ${T.border}`, borderRadius:T.radiusSm,
    fontSize:14, fontFamily:"inherit", outline:"none",
    boxSizing:"border-box", background:T.surface, color:T.text
  };
  const selectStyle = { ...inputStyle };
  const textareaStyle = { ...inputStyle, resize:"vertical", lineHeight:1.6 };

  return (
    <div style={{ minHeight:"100dvh", background:T.bg, display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:T.brandGrad, padding:"20px 20px 16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
          <button onClick={back} style={{ background:"rgba(255,255,255,0.2)",border:"none",borderRadius:10,padding:"8px",cursor:"pointer",color:"#fff",display:"flex" }}>
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

      <div style={{ flex:1, padding:"20px 20px", maxWidth:400, margin:"0 auto", width:"100%", boxSizing:"border-box" }}>
        {error && (
          <div style={{ background:"#FEE2E2", borderRadius:T.radiusSm, padding:"10px 14px", marginBottom:16, fontSize:13, color:T.danger, display:"flex", gap:8 }}>
            <span>⚠️</span><span>{error}</span>
          </div>
        )}

        {/* ── Step 1: ব্যক্তিগত তথ্য ── */}
        {step===1 && (
          <>
            <h3 style={{ fontWeight:800, marginBottom:4 }}>মালিকের তথ্য দিন</h3>
            <p style={{ color:T.textMuted, fontSize:13, marginBottom:20 }}>
              <span style={{ color:T.danger }}>*</span> চিহ্নিত তথ্য অবশ্যই দিতে হবে
            </p>

            <Field label="মোবাইল নম্বর" required>
              <input value={data.phone} onChange={e=>set("phone",e.target.value)}
                placeholder="01XXXXXXXXX" inputMode="tel" style={inputStyle}/>
            </Field>
            <Field label="মালিকের পুরো নাম" required>
              <input value={data.ownerName} onChange={e=>set("ownerName",e.target.value)}
                placeholder="আপনার পুরো নাম" style={inputStyle}/>
            </Field>
            <Field label="ইমেইল" helper="ঐচ্ছিক">
              <input value={data.email} onChange={e=>set("email",e.target.value)}
                placeholder="email@example.com" type="email" style={inputStyle}/>
            </Field>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <Field label="জন্ম তারিখ" required>
                <input value={data.ownerDob} onChange={e=>set("ownerDob",e.target.value)}
                  placeholder="DD/MM/YYYY" style={inputStyle}/>
              </Field>
              <Field label="লিঙ্গ" required>
                <select value={data.ownerGender} onChange={e=>set("ownerGender",e.target.value)} style={selectStyle}>
                  <option value="পুরুষ">পুরুষ</option>
                  <option value="মহিলা">মহিলা</option>
                  <option value="অন্যান্য">অন্যান্য</option>
                </select>
              </Field>
            </div>
            <Btn variant="primary" full onClick={() => { if(v1()) next(); }}>পরবর্তী →</Btn>
          </>
        )}

        {/* ── Step 2: ব্যবসার তথ্য ── */}
        {step===2 && (
          <>
            <h3 style={{ fontWeight:800, marginBottom:4 }}>ব্যবসার তথ্য</h3>
            <p style={{ color:T.textMuted, fontSize:13, marginBottom:20 }}>
              <span style={{ color:T.danger }}>*</span> চিহ্নিত তথ্য অবশ্যই দিতে হবে
            </p>
            <Field label="দোকানের নাম" required>
              <input value={data.bizName} onChange={e=>set("bizName",e.target.value)}
                placeholder="দোকানের নাম" style={inputStyle}/>
            </Field>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <Field label="ব্যবসার ধরন" required>
                <select value={data.bizType} onChange={e=>set("bizType",e.target.value)} style={selectStyle}>
                  <option value="ফিজিক্যাল">ফিজিক্যাল</option>
                  <option value="অনলাইন">অনলাইন</option>
                </select>
              </Field>
              <Field label="দোকানের ক্যাটাগরি" required>
                <select value={data.bizCategory} onChange={e=>set("bizCategory",e.target.value)} style={selectStyle}>
                  {SHOP_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
            <Field label="দোকানের ফোন" helper="ঐচ্ছিক">
              <input value={data.bizPhone} onChange={e=>set("bizPhone",e.target.value)}
                placeholder="01XXXXXXXXX" inputMode="tel" style={inputStyle}/>
            </Field>
            <Field label="দোকানের ইমেইল" helper="ঐচ্ছিক">
              <input value={data.bizEmail} onChange={e=>set("bizEmail",e.target.value)}
                placeholder="shop@example.com" type="email" style={inputStyle}/>
            </Field>
            <Field label="ওয়েবসাইট" helper="ঐচ্ছিক">
              <input value={data.bizWebsite} onChange={e=>set("bizWebsite",e.target.value)}
                placeholder="https://yourshop.com" style={inputStyle}/>
            </Field>
            <Field label="সোশ্যাল মিডিয়া লিংক" helper="ঐচ্ছিক">
              <input value={data.bizSocial} onChange={e=>set("bizSocial",e.target.value)}
                placeholder="https://facebook.com/yourshop" style={inputStyle}/>
            </Field>
            <Field label="ট্রেড লাইসেন্স নম্বর" helper="ঐচ্ছিক">
              <input value={data.tradeLicense} onChange={e=>set("tradeLicense",e.target.value)}
                placeholder="লাইসেন্স নম্বর" style={inputStyle}/>
            </Field>
            <Btn variant="primary" full onClick={() => { if(v2()) next(); }}>পরবর্তী →</Btn>
          </>
        )}

        {/* ── Step 3: ঠিকানা ── */}
        {step===3 && (
          <>
            <h3 style={{ fontWeight:800, marginBottom:4 }}>ঠিকানা</h3>
            <p style={{ color:T.textMuted, fontSize:13, marginBottom:20 }}>
              <span style={{ color:T.danger }}>*</span> চিহ্নিত তথ্য অবশ্যই দিতে হবে
            </p>

            <Field label="বিভাগ" required>
              <select value={data.division} onChange={e=>{ set("division",e.target.value); set("district",""); set("upazila",""); set("union",""); }} style={selectStyle}>
                <option value="">— বিভাগ নির্বাচন করুন —</option>
                {DIVISIONS.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </Field>

            <Field label="জেলা" required>
              <select value={data.district} onChange={e=>{ set("district",e.target.value); set("upazila",""); set("union",""); }} style={selectStyle} disabled={!data.division}>
                <option value="">— জেলা নির্বাচন করুন —</option>
                {districts.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </Field>

            <Field label="উপজেলা / থানা" required>
              <select value={data.upazila} onChange={e=>{ set("upazila",e.target.value); set("union",""); }} style={selectStyle} disabled={!data.district}>
                <option value="">— উপজেলা নির্বাচন করুন —</option>
                {upazilas.map(u=><option key={u} value={u}>{u}</option>)}
              </select>
            </Field>

            <Field label="ইউনিয়ন / পৌরসভা / ওয়ার্ড" required>
              {unions.length > 0 ? (
                <select value={data.union} onChange={e=>set("union",e.target.value)} style={selectStyle}>
                  <option value="">— ইউনিয়ন নির্বাচন করুন —</option>
                  {unions.map(u=><option key={u} value={u}>{u}</option>)}
                </select>
              ) : (
                <input value={data.union} onChange={e=>set("union",e.target.value)}
                  placeholder="ইউনিয়ন / পৌরসভা লিখুন" style={inputStyle}/>
              )}
            </Field>

            <Field label="গ্রাম / এলাকা / মহল্লা" required>
              <input value={data.village} onChange={e=>set("village",e.target.value)}
                placeholder="গ্রাম বা এলাকার নাম" style={inputStyle}/>
            </Field>

            <Field label="নির্দিষ্ট ঠিকানা / বাড়ি নম্বর" required>
              <textarea value={data.address} onChange={e=>set("address",e.target.value)}
                placeholder="বাড়ি নম্বর, রোড নম্বর, ব্লক, সেক্টর ইত্যাদি বিস্তারিত লিখুন..."
                rows={3} style={textareaStyle}/>
            </Field>

            <Btn variant="primary" full onClick={() => { if(v3()) next(); }}>পরবর্তী →</Btn>
          </>
        )}

        {/* ── Step 4: পাসওয়ার্ড ── */}
        {step===4 && (
          <>
            <h3 style={{ fontWeight:800, marginBottom:4 }}>পাসওয়ার্ড তৈরি করুন</h3>
            <p style={{ color:T.textMuted, fontSize:13, marginBottom:16 }}>
              <span style={{ color:T.danger }}>*</span> সব তথ্য অবশ্যই দিতে হবে
            </p>

            {/* তথ্য সারাংশ */}
            <div style={{ background:`${T.brand}08`, borderRadius:T.radiusSm, padding:"12px 14px", marginBottom:16, border:`1px solid ${T.brand}20` }}>
              <div style={{ fontSize:12, fontWeight:800, color:T.brand, marginBottom:8 }}>📋 তথ্য সারাংশ</div>
              {[
                { icon:"👤", val:`${data.ownerName} (${data.ownerGender})` },
                { icon:"📱", val:data.phone },
                { icon:"✉️", val:data.email||"—" },
                { icon:"🏪", val:`${data.bizName} — ${data.bizCategory} (${data.bizType})` },
                { icon:"📍", val:[data.division, data.district, data.upazila, data.union, data.village].filter(Boolean).join(", ") },
              ].map((r,i)=>(
                <div key={i} style={{ fontSize:12, color:T.textSub, marginBottom:3, display:"flex", gap:6 }}>
                  <span>{r.icon}</span><span>{r.val}</span>
                </div>
              ))}
            </div>

            <Field label="পাসওয়ার্ড" required>
              <input type="password" value={data.password} onChange={e=>set("password",e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষর" style={inputStyle}/>
            </Field>
            {data.password && (
              <div style={{ marginTop:-10, marginBottom:14 }}>
                <div style={{ height:4, borderRadius:2, background:"#E5E7EB", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${(passStr/4)*100}%`, background:strengthColors[passStr], transition:"all 0.3s" }}/>
                </div>
                <div style={{ fontSize:11, color:strengthColors[passStr], marginTop:4, fontWeight:600 }}>{strengthLabels[passStr]}</div>
              </div>
            )}

            <Field label="পাসওয়ার্ড নিশ্চিত করুন" required>
              <input type="password" value={data.confirmPassword} onChange={e=>set("confirmPassword",e.target.value)}
                placeholder="পাসওয়ার্ড আবার লিখুন" style={inputStyle}/>
            </Field>

            {/* Recovery Code */}
            <div style={{ background:`${T.warning}08`, borderRadius:T.radiusSm, padding:"12px 14px", marginBottom:14, border:`1px solid ${T.warning}30` }}>
              <div style={{ fontSize:12, fontWeight:800, color:T.warning, marginBottom:6 }}>🔑 রিকভারি কোড <span style={{ color:T.danger }}>*</span></div>
              <p style={{ fontSize:12, color:T.textSub, marginBottom:10, lineHeight:1.5 }}>
                পাসওয়ার্ড ভুলে গেলে এই ৬ সংখ্যার কোড দিয়ে পুনরুদ্ধার করতে পারবেন।
                <strong style={{ color:T.danger }}> এই কোড ছাড়া পাসওয়ার্ড পরিবর্তন করা যাবে না।</strong>
                নিরাপদ জায়গায় সংরক্ষণ করুন।
              </p>
              <input
                value={data.recoveryCode}
                onChange={e=>set("recoveryCode", e.target.value.replace(/\D/g,"").slice(0,6))}
                placeholder="যেমন: 123456"
                inputMode="numeric"
                maxLength={6}
                style={{ ...inputStyle, fontSize:20, letterSpacing:8, textAlign:"center", fontWeight:800, border:`2px solid ${data.recoveryCode.length===6?T.success:T.warning}` }}
              />
              {data.recoveryCode.length > 0 && data.recoveryCode.length < 6 && (
                <div style={{ fontSize:11, color:T.warning, marginTop:4 }}>⚠️ {6-data.recoveryCode.length}টি সংখ্যা আরো দিন</div>
              )}
              {data.recoveryCode.length === 6 && (
                <div style={{ fontSize:11, color:T.success, marginTop:4, fontWeight:600 }}>✅ রিকভারি কোড প্রস্তুত</div>
              )}
            </div>

            <Btn variant="primary" full onClick={submit} disabled={loading}>
              {loading ? "রেজিস্ট্রেশন হচ্ছে..." : "✅ রেজিস্ট্রেশন সম্পন্ন করুন"}
            </Btn>
          </>
        )}

        <Btn variant="ghost" full onClick={back} style={{ marginTop:8 }}>← পেছনে যান</Btn>
      </div>
    </div>
  );
}
