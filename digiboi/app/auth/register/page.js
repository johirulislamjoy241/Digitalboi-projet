"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { T, BD_DIVISIONS, BD_DISTRICTS, BD_UPAZILAS } from "@/lib/design";
import { Btn, Input, Select } from "@/lib/ui";
import { validateBDPhone, passwordStrength, strengthColors, strengthLabels } from "@/lib/helpers";

const SHOP_CATEGORIES = [
  "মুদি দোকান","ঔষধ ফার্মেসি","কাপড় বস্ত্র","ইলেকট্রনিক্স","মোবাইল আনুষাঙ্গিক",
  "রেস্তোরাঁ ফুড","বেকারি মিষ্টি","চা স্টল","সবজি তরকারি","মাছ মাংস",
  "জুতা চামড়া","কসমেটিক্স সৌন্দর্য","হার্ডওয়ার নির্মাণ","স্টেশনারি বই",
  "আসবাবপত্র","গ্যারেজ মোটর","কৃষি বীজ","পোল্ট্রি মৎস্য","অনলাইন শপ","অন্যান্য"
];

export default function RegisterPage({ onBack, onComplete }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    phone:"", email:"", ownerName:"", nid:"", ownerDob:"", ownerGender:"পুরুষ",
    bizType:"ফিজিক্যাল", bizName:"", bizCategory:"মুদি দোকান",
    bizPhone:"", bizEmail:"", bizWebsite:"", bizSocial:"", tradeLicense:"",
    division:"", district:"", upazila:"", postcode:"", address:"",
    lat:"", lng:"",
    password:"", confirmPassword:"",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const mapRef = useRef(null);
  const mapInitRef = useRef(false);

  const set = useCallback((k, v) => setData(d => ({ ...d, [k]: v })), []);
  const districts = BD_DISTRICTS[data.division] || [];
  const upazilas  = BD_UPAZILAS[data.district]  || [];
  const passStr   = passwordStrength(data.password);

  const next = () => { setError(""); setStep(s => s + 1); };
  const back = () => { setError(""); if (step > 1) setStep(s => s - 1); else onBack(); };

  // Google Map init
  useEffect(() => {
    if (step !== 3 || mapInitRef.current) return;
    const loadMap = () => {
      if (!window.google || !mapRef.current) return;
      mapInitRef.current = true;
      const defaultPos = { lat: 23.8103, lng: 90.4125 };
      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultPos, zoom: 12, mapTypeControl: false, streetViewControl: false
      });
      const marker = new window.google.maps.Marker({ position: defaultPos, map, draggable: true });
      marker.addListener("dragend", e => {
        set("lat", e.latLng.lat().toFixed(6));
        set("lng", e.latLng.lng().toFixed(6));
      });
      map.addListener("click", e => {
        marker.setPosition(e.latLng);
        set("lat", e.latLng.lat().toFixed(6));
        set("lng", e.latLng.lng().toFixed(6));
      });
    };
    if (window.google) { loadMap(); return; }
    if (!document.getElementById("gmap-script")) {
      const s = document.createElement("script");
      s.id = "gmap-script";
      s.src = "https://maps.googleapis.com/maps/api/js?key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY";
      s.async = true; s.onload = loadMap;
      document.head.appendChild(s);
    }
  }, [step, set]);

  const validateStep1 = () => {
    if (!validateBDPhone(data.phone)) { setError("সঠিক বাংলাদেশি নম্বর দিন"); return false; }
    if (!data.ownerName.trim()) { setError("মালিকের নাম দিন"); return false; }
    return true;
  };
  const validateStep2 = () => {
    if (!data.bizName.trim()) { setError("দোকানের নাম দিন"); return false; }
    return true;
  };
  const validateStep4 = () => {
    if (!data.password || data.password.length < 6) { setError("কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন"); return false; }
    if (data.password !== data.confirmPassword) { setError("পাসওয়ার্ড মিলছে না"); return false; }
    return true;
  };

  const submit = async () => {
    if (!validateStep4()) return;
    setLoading(true); setError("");
    try {
      const body = new FormData();
      const fields = {
        phone:data.phone, email:data.email, ownerName:data.ownerName,
        nid:data.nid, ownerDob:data.ownerDob, ownerGender:data.ownerGender,
        bizName:data.bizName, bizType:data.bizType, bizCategory:data.bizCategory,
        bizPhone:data.bizPhone, bizEmail:data.bizEmail,
        bizWebsite:data.bizWebsite, bizSocial:data.bizSocial, tradeLicense:data.tradeLicense,
        division:data.division, district:data.district, upazila:data.upazila,
        postcode:data.postcode, address:data.address,
        lat:data.lat, lng:data.lng, password:data.password
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

      <div style={{ flex:1, padding:"24px 20px", maxWidth:400, margin:"0 auto", width:"100%", boxSizing:"border-box" }}>
        {error && (
          <div style={{ background:"#FEE2E2", borderRadius:T.radiusSm, padding:"10px 14px", marginBottom:16, fontSize:13, color:T.danger }}>
            ⚠️ {error}
          </div>
        )}

        {step===1 && (
          <>
            <h3 style={{ fontWeight:800, marginBottom:4 }}>মালিকের তথ্য দিন</h3>
            <p style={{ color:T.textMuted, fontSize:13, marginBottom:20 }}>আপনার ব্যক্তিগত তথ্য দিন</p>
            <Input label="মোবাইল নম্বর *" value={data.phone} onChange={v => set("phone",v)} placeholder="01XXXXXXXXX" inputMode="tel"/>
            <Input label="মালিকের পুরো নাম *" value={data.ownerName} onChange={v => set("ownerName",v)} placeholder="আপনার পুরো নাম"/>
            <Input label="ইমেইল (ঐচ্ছিক)" value={data.email} onChange={v => set("email",v)} placeholder="email@example.com" type="email"/>
            <Input label="NID / জাতীয় পরিচয়পত্র নম্বর (ঐচ্ছিক)" value={data.nid} onChange={v => set("nid",v)} placeholder="NID নম্বর" inputMode="numeric"/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <Input label="জন্ম তারিখ (ঐচ্ছিক)" value={data.ownerDob} onChange={v => set("ownerDob",v)} placeholder="DD/MM/YYYY"/>
              <Select label="লিঙ্গ" value={data.ownerGender} onChange={v => set("ownerGender",v)} options={["পুরুষ","মহিলা","অন্যান্য"]}/>
            </div>
            <Btn variant="primary" full onClick={() => { if(validateStep1()) next(); }}>পরবর্তী →</Btn>
          </>
        )}

        {step===2 && (
          <>
            <h3 style={{ fontWeight:800, marginBottom:4 }}>ব্যবসার তথ্য</h3>
            <p style={{ color:T.textMuted, fontSize:13, marginBottom:20 }}>আপনার দোকানের তথ্য দিন</p>
            <Input label="দোকানের নাম *" value={data.bizName} onChange={v => set("bizName",v)} placeholder="দোকানের নাম"/>
            <Select label="ব্যবসার ধরন *" value={data.bizType} onChange={v => set("bizType",v)} options={["ফিজিক্যাল","অনলাইন"]}/>
            <Select label="দোকানের ক্যাটাগরি *" value={data.bizCategory} onChange={v => set("bizCategory",v)} options={SHOP_CATEGORIES}/>
            <Input label="দোকানের ফোন (ঐচ্ছিক)" value={data.bizPhone} onChange={v => set("bizPhone",v)} placeholder="01XXXXXXXXX" inputMode="tel"/>
            <Input label="দোকানের ইমেইল (ঐচ্ছিক)" value={data.bizEmail} onChange={v => set("bizEmail",v)} placeholder="shop@example.com" type="email"/>
            <Input label="ওয়েবসাইট লিংক (ঐচ্ছিক)" value={data.bizWebsite} onChange={v => set("bizWebsite",v)} placeholder="https://yourshop.com"/>
            <Input label="সোশ্যাল মিডিয়া লিংক (ঐচ্ছিক)" value={data.bizSocial} onChange={v => set("bizSocial",v)} placeholder="https://facebook.com/yourshop"/>
            <Input label="ট্রেড লাইসেন্স নম্বর (ঐচ্ছিক)" value={data.tradeLicense} onChange={v => set("tradeLicense",v)} placeholder="লাইসেন্স নম্বর"/>
            <Btn variant="primary" full onClick={() => { if(validateStep2()) next(); }}>পরবর্তী →</Btn>
          </>
        )}

        {step===3 && (
          <>
            <h3 style={{ fontWeight:800, marginBottom:4 }}>ঠিকানা</h3>
            <p style={{ color:T.textMuted, fontSize:13, marginBottom:20 }}>দোকানের অবস্থান দিন</p>
            <Select label="বিভাগ" value={data.division} onChange={v => { set("division",v); set("district",""); set("upazila",""); }} options={["", ...BD_DIVISIONS]}/>
            {districts.length>0 && (
              <Select label="জেলা" value={data.district} onChange={v => { set("district",v); set("upazila",""); }} options={["", ...districts]}/>
            )}
            {upazilas.length>0 && (
              <Select label="উপজেলা / থানা" value={data.upazila} onChange={v => set("upazila",v)} options={["", ...upazilas]}/>
            )}
            <Input label="পোস্টাল কোড (ঐচ্ছিক)" value={data.postcode} onChange={v => set("postcode",v)} placeholder="1200" inputMode="numeric"/>
            <Input label="সম্পূর্ণ ঠিকানা (ঐচ্ছিক)" value={data.address} onChange={v => set("address",v)} placeholder="রোড নম্বর, এলাকা, বাড়ি নম্বর..."/>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:700, color:T.textSub, marginBottom:6 }}>
                📍 Google Map — লাইভ লোকেশন (ঐচ্ছিক)
              </label>
              <p style={{ fontSize:11, color:T.textMuted, marginBottom:8 }}>মানচিত্রে ক্লিক করুন বা মার্কার টেনে সঠিক অবস্থান দিন</p>
              <div ref={mapRef} style={{ width:"100%", height:200, borderRadius:T.radiusSm, border:`1.5px solid ${T.border}`, background:"#E8F5E9", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ color:T.textMuted, fontSize:13, textAlign:"center" }}>
                  <div style={{ fontSize:24, marginBottom:4 }}>🗺️</div>
                  মানচিত্র লোড হচ্ছে...
                </div>
              </div>
              {data.lat && data.lng && (
                <div style={{ fontSize:11, color:T.success, marginTop:6, fontWeight:600 }}>
                  ✅ অবস্থান নির্বাচিত: {data.lat}, {data.lng}
                </div>
              )}
            </div>
            <Btn variant="primary" full onClick={next}>পরবর্তী →</Btn>
          </>
        )}

        {step===4 && (
          <>
            <h3 style={{ fontWeight:800, marginBottom:4 }}>পাসওয়ার্ড তৈরি করুন</h3>
            <p style={{ color:T.textMuted, fontSize:13, marginBottom:8 }}>এই তথ্য দিয়ে লগইন করবেন</p>
            <div style={{ background:`${T.brand}08`, borderRadius:T.radiusSm, padding:"12px 14px", marginBottom:16, border:`1px solid ${T.brand}20` }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.brand, marginBottom:6 }}>📋 তথ্য সারাংশ</div>
              <div style={{ fontSize:12, color:T.textSub }}>📱 {data.phone}</div>
              <div style={{ fontSize:12, color:T.textSub }}>🏪 {data.bizName} — {data.bizCategory}</div>
              {data.division && <div style={{ fontSize:12, color:T.textSub }}>📍 {data.division}{data.district?`, ${data.district}`:""}</div>}
            </div>
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
          <Btn variant="ghost" full onClick={back} style={{ marginTop:8 }}>← পেছনে যান</Btn>
        )}
      </div>
    </div>
  );
}
