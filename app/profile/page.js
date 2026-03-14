"use client";
import { useState, useCallback } from "react";
import { T } from "@/lib/design";
import { Card, Btn, Input } from "@/lib/ui";
import { SvgIcon } from "@/lib/icons";

export default function ProfilePage({ user, onBack, onUserUpdate }) {
  const [tab,     setTab]     = useState("info");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const [info, setInfo] = useState({
    name:  user?.name  || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [pass, setPass] = useState({ current:"", newPass:"", confirm:"" });
  const [showPass, setShowPass] = useState({ current:false, newPass:false, confirm:false });

  const token = typeof window !== "undefined" ? localStorage.getItem("digiboi_token") : "";

  const saveInfo = async () => {
    if (!info.name) return setError("নাম দিন");
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ name: info.name, email: info.email }),
      });
      const d = await res.json();
      if (d.success) {
        const updatedUser = { ...user, name: info.name, email: info.email };
        localStorage.setItem("digiboi_user", JSON.stringify(updatedUser));
        onUserUpdate?.(updatedUser);
        setSuccess("✅ প্রোফাইল আপডেট হয়েছে");
      } else setError(d.error || "আপডেট ব্যর্থ");
    } catch { setError("সার্ভার সমস্যা"); }
    setSaving(false);
  };

  const changePassword = async () => {
    if (!pass.current) return setError("বর্তমান পাসওয়ার্ড দিন");
    if (pass.newPass.length < 6) return setError("নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষর");
    if (pass.newPass !== pass.confirm) return setError("পাসওয়ার্ড মিলছে না");
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ action:"change_password", oldPassword: pass.current, newPassword: pass.newPass }),
      });
      const d = await res.json();
      if (d.success) {
        setSuccess("✅ পাসওয়ার্ড পরিবর্তন হয়েছে");
        setPass({ current:"", newPass:"", confirm:"" });
      } else setError(d.error || "পরিবর্তন ব্যর্থ");
    } catch { setError("সার্ভার সমস্যা"); }
    setSaving(false);
  };

  const passStr = (() => {
    let s = 0;
    if (pass.newPass.length >= 6) s++;
    if (pass.newPass.length >= 10) s++;
    if (/[A-Z]/.test(pass.newPass)) s++;
    if (/[0-9]/.test(pass.newPass)) s++;
    return s;
  })();
  const strColors = ["#EF4444","#F59E0B","#F59E0B","#10B981","#10B981"];
  const strLabels = ["","খুব দুর্বল","দুর্বল","মাঝারি","শক্তিশালী"];

  return (
    <div style={{ paddingBottom:20 }}>
      {/* Header */}
      <div style={{ background:T.brandGrad, padding:"20px 16px 24px", marginBottom:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <button onClick={onBack} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:"8px", cursor:"pointer", color:"#fff", display:"flex" }}>
            <SvgIcon icon="back" size={18} color="#fff"/>
          </button>
          <span style={{ color:"#fff", fontWeight:800, fontSize:17 }}>প্রোফাইল সম্পাদনা</span>
        </div>
        {/* Avatar */}
        <div style={{ textAlign:"center" }}>
          <div style={{ width:72, height:72, borderRadius:20, background:"rgba(255,255,255,0.25)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px", border:"3px solid rgba(255,255,255,0.4)" }}>
            <span style={{ color:"#fff", fontWeight:800, fontSize:30 }}>{(user?.name||"?")[0]?.toUpperCase()}</span>
          </div>
          <div style={{ color:"#fff", fontWeight:800, fontSize:17 }}>{user?.name}</div>
          <div style={{ color:"rgba(255,255,255,0.8)", fontSize:12, marginTop:4 }}>{user?.phone}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", background:"#F0F2F8", margin:"16px 16px 0", borderRadius:10, padding:3 }}>
        {[{id:"info",label:"👤 তথ্য"},{id:"password",label:"🔑 পাসওয়ার্ড"}].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setError(""); setSuccess(""); }} style={{ flex:1, padding:"10px", border:"none", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", background:tab===t.id?"white":"transparent", color:tab===t.id?T.brand:T.textSub, boxShadow:tab===t.id?"0 2px 8px rgba(0,0,0,.08)":"none" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:"16px 16px 0" }}>
        {(error||success) && (
          <div style={{ background:error?"#FEE2E2":"#D1FAE5", borderRadius:T.radiusSm, padding:"10px 14px", marginBottom:14, fontSize:13, color:error?T.danger:T.success }}>
            {error||success}
          </div>
        )}

        {tab === "info" && (
          <Card>
            <div style={{ fontWeight:800, fontSize:14, marginBottom:16 }}>ব্যক্তিগত তথ্য</div>
            <Input label="পূর্ণ নাম *" value={info.name} onChange={v => setInfo(i=>({...i,name:v}))} placeholder="আপনার নাম"/>
            <Input label="ইমেইল" type="email" value={info.email} onChange={v => setInfo(i=>({...i,email:v}))} placeholder="email@example.com"/>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:700, color:T.textSub, marginBottom:6 }}>মোবাইল নম্বর</label>
              <input value={info.phone} readOnly style={{ width:"100%", padding:"12px 14px", border:`1.5px solid ${T.border}`, borderRadius:T.radiusSm, fontSize:14, background:"#F9FAFB", color:T.textMuted, boxSizing:"border-box", fontFamily:"inherit", cursor:"not-allowed" }}/>
              <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>ফোন নম্বর পরিবর্তন করা যাবে না</div>
            </div>

            {/* Account info */}
            <div style={{ background:`${T.brand}08`, borderRadius:T.radiusSm, padding:"12px 14px", marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.textSub, marginBottom:8 }}>অ্যাকাউন্ট তথ্য</div>
              {[
                ["দোকান", user?.shopName||"—"],
                ["ভূমিকা", user?.role==="owner"?"মালিক":"কর্মচারী"],
                ["পরিকল্পনা", "Free"],
              ].map(([k,v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:`1px solid ${T.border}30` }}>
                  <span style={{ fontSize:12, color:T.textMuted }}>{k}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:T.text }}>{v}</span>
                </div>
              ))}
            </div>

            <Btn variant="primary" full onClick={saveInfo} disabled={saving}>
              {saving ? "সংরক্ষণ হচ্ছে..." : "💾 পরিবর্তন সংরক্ষণ"}
            </Btn>
          </Card>
        )}

        {tab === "password" && (
          <Card>
            <div style={{ fontWeight:800, fontSize:14, marginBottom:16 }}>পাসওয়ার্ড পরিবর্তন</div>
            {["current","newPass","confirm"].map((k,i) => {
              const labels = ["বর্তমান পাসওয়ার্ড", "নতুন পাসওয়ার্ড", "পাসওয়ার্ড নিশ্চিত করুন"];
              return (
                <div key={k} style={{ position:"relative", marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:12, fontWeight:700, color:T.textSub, marginBottom:6 }}>{labels[i]} *</label>
                  <input
                    type={showPass[k]?"text":"password"}
                    value={pass[k]}
                    onChange={e => setPass(p=>({...p,[k]:e.target.value}))}
                    placeholder="••••••••"
                    style={{ width:"100%", padding:"12px 44px 12px 14px", border:`1.5px solid ${T.border}`, borderRadius:T.radiusSm, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}
                    onFocus={e => e.target.style.borderColor = T.brand}
                    onBlur={e => e.target.style.borderColor = T.border}
                  />
                  <button onClick={() => setShowPass(s=>({...s,[k]:!s[k]}))} style={{ position:"absolute", right:12, top:30, background:"none", border:"none", cursor:"pointer", color:T.textMuted, fontSize:16 }}>
                    {showPass[k] ? "🙈" : "👁️"}
                  </button>
                </div>
              );
            })}
            {pass.newPass.length > 0 && (
              <div style={{ marginBottom:14 }}>
                <div style={{ display:"flex", gap:4, marginBottom:4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex:1, height:4, borderRadius:2, background: i<=passStr ? strColors[passStr-1] : T.border, transition:"background 0.3s" }}/>
                  ))}
                </div>
                <div style={{ fontSize:11, color:strColors[passStr-1], fontWeight:600 }}>{strLabels[passStr]}</div>
              </div>
            )}
            <Btn variant="primary" full onClick={changePassword} disabled={saving} style={{ background:"linear-gradient(135deg,#EF4444,#F87171)", boxShadow:"none" }}>
              {saving ? "পরিবর্তন হচ্ছে..." : "🔑 পাসওয়ার্ড পরিবর্তন করুন"}
            </Btn>
          </Card>
        )}
      </div>
    </div>
  );
}
