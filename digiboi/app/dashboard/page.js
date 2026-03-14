"use client";
import { useState, useEffect, useCallback } from "react";
import { T } from "@/lib/design";
import { Card, Badge, Spinner, EmptyState } from "@/lib/ui";
import { SvgIcon } from "@/lib/icons";
import { taka, greeting, fmtDate } from "@/lib/helpers";

export default function DashboardPage({ user, setActive }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!user?.shopId) { setLoading(false); return; }
    fetch(`/api/dashboard?shopId=${user.shopId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user?.shopId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ padding:60, textAlign:"center" }}>
      <Spinner/>
      <div style={{ color:T.textMuted, fontSize:13, marginTop:12 }}>লোড হচ্ছে...</div>
    </div>
  );

  const stats = [
    { label:"আজকের বিক্রয়", value:taka(data?.todayTotal||0),  color:T.brand,   icon:"cart",    bg:`${T.brand}15` },
    { label:"মাসের বিক্রয়",  value:taka(data?.monthTotal||0), color:T.success, icon:"trending", bg:`${T.success}15` },
    { label:"মোট বাকি",      value:taka(data?.totalDue||0),   color:T.warning, icon:"alert",   bg:`${T.warning}15` },
    { label:"আজকের অর্ডার",  value:data?.todayOrders||0,      color:T.info,    icon:"receipt", bg:`${T.info}15` },
  ];

  const maxChart = Math.max(...(data?.chartData||[{sales:1}]).map(d=>d.sales), 1);

  return (
    <div style={{ padding:"16px 16px 0" }}>

      {/* Greeting card */}
      <div style={{ background:T.brandGrad, borderRadius:T.radiusLg, padding:"18px 20px", marginBottom:16, color:"#fff", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:-20, top:-20, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.08)" }}/>
        <div style={{ position:"absolute", right:20, bottom:-30, width:70, height:70, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }}/>
        <div style={{ fontSize:13, opacity:.85, marginBottom:2 }}>{greeting()} 👋</div>
        <div style={{ fontWeight:800, fontSize:19 }}>{user?.name}</div>
        <div style={{ fontSize:12, opacity:.75, marginTop:2 }}>{user?.shopName}</div>
        {data?.todayOrders > 0 && (
          <div style={{ marginTop:10, background:"rgba(255,255,255,0.18)", borderRadius:8, padding:"6px 12px", display:"inline-block", fontSize:12, fontWeight:700 }}>
            🎉 আজ {data.todayOrders}টি বিক্রয় — {taka(data.todayTotal)}
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        {stats.map((s,i) => (
          <Card key={i} style={{ padding:"14px 12px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <SvgIcon icon={s.icon} size={18} color={s.color}/>
              </div>
            </div>
            <div style={{ fontWeight:800, fontSize:18, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        <button onClick={() => setActive("pos")}
          style={{ padding:"14px", borderRadius:T.radius, background:T.brandGrad, border:"none", cursor:"pointer", color:"#fff", fontWeight:700, fontSize:13, fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:`0 4px 14px ${T.brand}40` }}>
          <SvgIcon icon="pos" size={16} color="#fff"/>নতুন বিক্রয়
        </button>
        <button onClick={() => setActive("inventory")}
          style={{ padding:"14px", borderRadius:T.radius, background:`${T.info}12`, border:`1px solid ${T.info}30`, cursor:"pointer", color:T.info, fontWeight:700, fontSize:13, fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <SvgIcon icon="plus" size={16} color={T.info}/>পণ্য যোগ
        </button>
      </div>

      {/* Monthly bar chart */}
      {data?.chartData?.length > 0 && (
        <Card style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div style={{ fontWeight:800, fontSize:14 }}>📈 মাসিক বিক্রয়</div>
            <div style={{ fontSize:12, color:T.textMuted }}>{data.chartData[data.chartData.length-1]?.month}</div>
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"flex-end", height:80 }}>
            {data.chartData.map((d,i) => {
              const isLast = i === data.chartData.length - 1;
              const h = Math.max(4, Math.round((d.sales/maxChart)*70));
              return (
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div style={{ width:"100%", background: isLast ? T.brandGrad : `${T.brand}40`, borderRadius:"4px 4px 0 0", height:h, minHeight:4, transition:"height 0.5s" }}/>
                  <div style={{ fontSize:9, color: isLast ? T.brand : T.textMuted, fontWeight: isLast ? 700 : 400 }}>{d.month}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:10, padding:"8px 0", borderTop:`1px solid ${T.border}` }}>
            <div style={{ fontSize:12, color:T.textMuted }}>এই মাস</div>
            <div style={{ fontSize:12, fontWeight:800, color:T.brand }}>{taka(data.monthTotal||0)}</div>
          </div>
        </Card>
      )}

      {/* Low stock warning */}
      {data?.lowStockItems?.length > 0 && (
        <Card style={{ marginBottom:16, border:`1.5px solid ${T.warning}40` }}>
          <div style={{ fontWeight:800, fontSize:14, color:T.warning, marginBottom:10 }}>
            ⚠️ লো স্টক সতর্কতা ({data.lowStockItems.length}টি পণ্য)
          </div>
          {data.lowStockItems.slice(0,4).map(p => (
            <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
              <div style={{ fontSize:13, fontWeight:600 }}>{p.name}</div>
              <Badge color={+p.stock===0?"danger":"warning"}>
                {+p.stock===0 ? "শূন্য" : `${p.stock} ${p.unit} বাকি`}
              </Badge>
            </div>
          ))}
          {data.lowStockItems.length > 4 && (
            <div style={{ fontSize:12, color:T.textMuted, marginTop:8, textAlign:"center" }}>
              + আরও {data.lowStockItems.length - 4}টি পণ্য
            </div>
          )}
          <button onClick={() => setActive("inventory")}
            style={{ width:"100%", marginTop:10, padding:"8px", borderRadius:T.radiusSm, background:`${T.warning}15`, border:`1px solid ${T.warning}30`, cursor:"pointer", color:T.warning, fontWeight:700, fontSize:12, fontFamily:"inherit" }}>
            স্টক আপডেট করুন →
          </button>
        </Card>
      )}

      {/* Recent sales */}
      <Card style={{ marginBottom:80 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontWeight:800, fontSize:14 }}>🧾 সাম্প্রতিক বিক্রয়</div>
          <button onClick={() => setActive("more")}
            style={{ fontSize:12, color:T.brand, fontWeight:700, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
            সব দেখুন →
          </button>
        </div>
        {!data?.recentSales?.length
          ? <EmptyState icon="🧾" title="কোনো বিক্রয় নেই" sub="POS থেকে বিক্রয় শুরু করুন"/>
          : data.recentSales.map(s => (
            <div key={s.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${T.border}` }}>
              <div>
                <div style={{ fontWeight:700, fontSize:13 }}>{s.invoice_id}</div>
                <div style={{ fontSize:11, color:T.textMuted }}>
                  {s.customers?.name||"সাধারণ"} · {fmtDate(s.created_at)}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:800, color:T.brand, fontSize:14 }}>{taka(s.total)}</div>
                <Badge color={s.status==="paid"?"success":s.status==="due"?"warning":"info"}>
                  {s.status==="paid"?"✅ পরিশোধ":s.status==="due"?"⚠️ বাকি":"🔄 আংশিক"}
                </Badge>
              </div>
            </div>
          ))
        }
      </Card>
    </div>
  );
}
