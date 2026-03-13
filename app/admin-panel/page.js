"use client";
import { useState, useEffect } from "react";
import { T } from '@/lib/design';
import { Card, Btn, Avatar, Badge, Spinner } from '@/lib/ui';
import { SvgIcon } from '@/lib/icons';
import { taka } from '@/lib/helpers';

function TopBar({ title, onBack }) {
  return (
    <div style={{ background:T.surface,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:50 }}>
      <button onClick={onBack} style={{ background:`${T.brand}12`,border:"none",borderRadius:10,padding:"8px",cursor:"pointer",color:T.brand,display:"flex" }}><SvgIcon icon="back" size={18}/></button>
      <h1 style={{ margin:0,fontSize:17,fontWeight:800,color:T.text }}>{title}</h1>
    </div>
  );
}

export default function AdminPanelPage({ onBack }) {
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("shops");

  useEffect(()=>{
    fetch("/api/admin").then(r=>r.json()).then(d=>{ if(d.success) setData(d.data); setLoading(false); }).catch(()=>setLoading(false));
  },[]);

  const action = async (shopId, act) => {
    await fetch("/api/admin",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({shopId,action:act})});
    setData(d=>({...d,shops:d.shops.map(s=>s.id===shopId?{...s,status:act==="block"?"blocked":"active",is_active:act!=="block"}:s)}));
  };

  return (
    <div style={{ paddingBottom:80 }}>
      <TopBar title="অ্যাডমিন প্যানেল" onBack={onBack}/>
      {loading ? <div style={{ padding:40,textAlign:"center" }}><Spinner/></div> : (
        <div style={{ padding:16 }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16 }}>
            {[
              {l:"মোট দোকান",v:data?.totalShops||0,c:T.info},
              {l:"সক্রিয়",v:data?.activeShops||0,c:T.success},
              {l:"মোট রাজস্ব",v:taka(data?.totalRevenue||0),c:T.brand},
              {l:"মোট ব্যবহারকারী",v:data?.users?.length||0,c:T.purple},
            ].map((s,i)=>(
              <Card key={i} style={{ textAlign:"center",padding:"14px 10px" }}>
                <div style={{ fontSize:22,fontWeight:800,color:s.c }}>{s.v}</div>
                <div style={{ fontSize:11,color:T.textMuted }}>{s.l}</div>
              </Card>
            ))}
          </div>

          <div style={{ display:"flex",background:"#F0F2F8",borderRadius:10,padding:3,marginBottom:16 }}>
            {[{id:"shops",label:"দোকান"},{id:"users",label:"ব্যবহারকারী"}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1,padding:9,borderRadius:8,border:"none",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",background:tab===t.id?T.surface:"transparent",color:tab===t.id?T.brand:T.textSub,boxShadow:tab===t.id?T.shadow:"none",transition:"all 0.2s" }}>{t.label}</button>
            ))}
          </div>

          {tab==="shops" && data?.shops?.map(s=>(
            <Card key={s.id} style={{ marginBottom:10,padding:14 }}>
              <div style={{ display:"flex",gap:10,alignItems:"flex-start" }}>
                <Avatar name={s.name} size={44}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800,fontSize:14 }}>{s.name}</div>
                  <div style={{ fontSize:12,color:T.textMuted,marginBottom:6 }}>{s.users?.name} · {s.biz_type||"ফিজিক্যাল"}</div>
                  <div style={{ display:"flex",gap:6 }}>
                    <Badge color={s.plan==="Premium"?"brand":s.plan==="Basic"?"info":"dark"}>{s.plan||"Free"}</Badge>
                    <Badge color={s.status==="active"?"success":s.status==="pending"?"warning":"danger"}>{s.status==="active"?"সক্রিয়":s.status==="pending"?"পেন্ডিং":"ব্লক"}</Badge>
                  </div>
                </div>
                <div style={{ display:"flex",gap:6 }}>
                  {s.status==="pending"&&<Btn variant="success" size="sm" onClick={()=>action(s.id,"approve")}><SvgIcon icon="check" size={14}/>অনুমোদন</Btn>}
                  {s.status!=="pending"&&<Btn variant={s.status==="blocked"?"success":"danger"} size="sm" onClick={()=>action(s.id,s.status==="blocked"?"unblock":"block")}>{s.status==="blocked"?"আনব্লক":"ব্লক"}</Btn>}
                </div>
              </div>
            </Card>
          ))}

          {tab==="users" && data?.users?.map(u=>(
            <Card key={u.id} style={{ marginBottom:10,padding:14 }}>
              <div style={{ display:"flex",gap:10,alignItems:"center" }}>
                <Avatar name={u.name} size={40}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700,fontSize:14 }}>{u.name}</div>
                  <div style={{ fontSize:12,color:T.textMuted }}>{u.phone} {u.email?`· ${u.email}`:""}</div>
                </div>
                <Badge color={u.is_active?"success":"danger"}>{u.is_active?"সক্রিয়":"নিষ্ক্রিয়"}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
