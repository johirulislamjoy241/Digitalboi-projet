"use client";
import { useState, useEffect } from "react";
import { T } from "@/lib/design";
import { SvgIcon } from "@/lib/icons";
import LoginPage      from "./auth/login/page";
import RegisterPage   from "./auth/register/page";
import ForgotPage     from "./auth/forgot-password/page";
import DashboardPage  from "./dashboard/page";
import POSPage        from "./pos/page";
import InventoryPage  from "./inventory/page";
import CustomersPage  from "./customers/page";
import MorePage       from "./more/page";

const NAV = [
  { id:"dashboard", icon:"home",  label:"হোম" },
  { id:"pos",       icon:"pos",   label:"বিক্রয়" },
  { id:"inventory", icon:"box",   label:"স্টক" },
  { id:"customers", icon:"users", label:"কাস্টমার" },
  { id:"more",      icon:"menu",  label:"আরও" },
];

const TITLES = { dashboard:"ড্যাশবোর্ড", inventory:"ইনভেন্টরি", customers:"কাস্টমার", more:"আরও" };

function BottomNav({ active, setActive }) {
  return (
    <nav style={{ position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:T.surface,borderTop:`1px solid ${T.border}`,display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom,0px)",boxShadow:"0 -4px 20px rgba(0,0,0,0.06)" }}>
      {NAV.map(item => {
        const on = active === item.id;
        return (
          <button key={item.id} onClick={() => setActive(item.id)} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"10px 4px 8px",border:"none",background:"none",cursor:"pointer",color:on?T.brand:"#94A3B8",transition:"color 0.2s",position:"relative",fontFamily:"inherit" }}>
            {on && <span style={{ position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:28,height:3,background:T.brandGrad,borderRadius:"0 0 4px 4px" }}/>}
            {item.id === "pos"
              ? <div style={{ width:44,height:44,borderRadius:14,background:on?T.brandGrad:`${T.brand}15`,display:"flex",alignItems:"center",justifyContent:"center",marginTop:-18,boxShadow:on?T.shadowLg:"none",transition:"all 0.2s" }}><SvgIcon icon={item.icon} size={22} color={on?"#fff":T.brand}/></div>
              : <SvgIcon icon={item.icon} size={22} color={on?T.brand:"#94A3B8"}/>
            }
            <span style={{ fontSize:10,fontWeight:on?700:500,lineHeight:1 }}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function TopBar({ title, user, onProfileClick }) {
  return (
    <div style={{ background:T.surface,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:50,boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
      <div>
        <div style={{ fontWeight:800,fontSize:17,color:T.text }}>{title}</div>
        {user?.shopName && <div style={{ fontSize:11,color:T.textMuted }}>{user.shopName}</div>}
      </div>
      <div onClick={onProfileClick} style={{ width:38,height:38,borderRadius:12,background:T.brandGrad,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:15,cursor:"pointer",flexShrink:0 }}>
        {(user?.name||"?")[0]?.toUpperCase()}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("loading");
  const [user,   setUser]   = useState(null);
  const [active, setActive] = useState("dashboard");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("digiboi_user");
      const token  = localStorage.getItem("digiboi_token");
      if (stored && token) { setUser(JSON.parse(stored)); setScreen("app"); }
      else setScreen("login");
    } catch { setScreen("login"); }
  }, []);

  const handleLogin  = (u) => { setUser(u); setScreen("app"); setActive("dashboard"); };
  const handleLogout = () => {
    localStorage.removeItem("digiboi_user");
    localStorage.removeItem("digiboi_token");
    setUser(null); setScreen("login");
  };

  if (screen === "loading") {
    return (
      <div style={{ minHeight:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",background:T.brandGrad }}>
        <div style={{ textAlign:"center",color:"#fff" }}>
          <div style={{ fontSize:48,marginBottom:12 }}>🛒</div>
          <div style={{ fontWeight:800,fontSize:24,letterSpacing:-0.5 }}>Digiboi</div>
          <div style={{ fontSize:13,opacity:.8,marginTop:4 }}>লোড হচ্ছে...</div>
        </div>
      </div>
    );
  }

  if (screen === "register") return (
    <div style={{ background:T.bg,minHeight:"100dvh",display:"flex",justifyContent:"center" }}>
      <div style={{ width:"100%",maxWidth:430 }}>
        <RegisterPage onBack={() => setScreen("login")} onComplete={handleLogin}/>
      </div>
    </div>
  );

  if (screen === "forgot") return (
    <div style={{ background:T.bg,minHeight:"100dvh",display:"flex",justifyContent:"center" }}>
      <div style={{ width:"100%",maxWidth:430 }}>
        <ForgotPage onBack={() => setScreen("login")} onDone={() => setScreen("login")}/>
      </div>
    </div>
  );

  if (screen === "login") return (
    <div style={{ background:T.bg,minHeight:"100dvh",display:"flex",justifyContent:"center" }}>
      <div style={{ width:"100%",maxWidth:430 }}>
        <LoginPage
          onLogin={handleLogin}
          onRegister={() => setScreen("register")}
          onForgot={() => setScreen("forgot")}
        />
      </div>
    </div>
  );

  // ── App Shell ──
  const showTopBar = active !== "pos";
  return (
    <div style={{ background:T.bg,minHeight:"100dvh",display:"flex",justifyContent:"center" }}>
      <div style={{ width:"100%",maxWidth:430,display:"flex",flexDirection:"column",minHeight:"100dvh" }}>
        {showTopBar && (
          <TopBar
            title={TITLES[active] || "Digiboi"}
            user={user}
            onProfileClick={() => setActive("more")}
          />
        )}
        <div style={{ flex:1,overflowY:"auto",paddingBottom:64 }}>
          {active === "dashboard"  && <DashboardPage  user={user} setActive={setActive}/>}
          {active === "pos"        && <POSPage         user={user}/>}
          {active === "inventory"  && <InventoryPage   user={user}/>}
          {active === "customers"  && <CustomersPage   user={user}/>}
          {active === "more"       && <MorePage         user={user} onLogout={handleLogout} onUserUpdate={(u) => { setUser(u); localStorage.setItem("digiboi_user", JSON.stringify(u)); }}/>}
        </div>
        <BottomNav active={active} setActive={setActive}/>
      </div>
    </div>
  );
}
