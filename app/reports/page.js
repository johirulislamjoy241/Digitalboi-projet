"use client";
import { useState, useEffect } from "react";
import { T } from "@/lib/design";
import { Card, Badge, Btn, Spinner, EmptyState } from "@/lib/ui";
import { SvgIcon } from "@/lib/icons";
import { taka, fmtDate } from "@/lib/helpers";

function TopBar({ title, onBack }) {
  return (
    <div style={{ background:T.surface,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:50 }}>
      {onBack && <button onClick={onBack} style={{ background:`${T.brand}12`,border:"none",borderRadius:10,padding:"8px",cursor:"pointer",color:T.brand,display:"flex" }}><SvgIcon icon="back" size={18}/></button>}
      <h1 style={{ margin:0,fontSize:17,fontWeight:800,color:T.text }}>{title}</h1>
    </div>
  );
}

export default function ReportsPage({ onBack, user }) {
  const [tab,     setTab]     = useState("summary");
  const [data,    setData]    = useState(null);
  const [sales,   setSales]   = useState([]);
  const [loading, setLoading] = useState(true);
  const shopId = user?.shopId;

  useEffect(() => {
    if (!shopId) { setLoading(false); return; }
    Promise.all([
      fetch(`/api/dashboard?shopId=${shopId}`).then(r=>r.json()),
      fetch(`/api/sales?shopId=${shopId}&limit=50`).then(r=>r.json()),
    ]).then(([d, s]) => {
      if (d.success) setData(d.data);
      if (s.success) setSales(s.data||[]);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, [shopId]);

  const maxS = data?.chartData ? Math.max(...data.chartData.map(d=>d.sales), 1) : 1;

  // Group sales by payment method
  const methodTotals = sales.reduce((acc, s) => {
    const m = s.payment_method||"নগদ";
    acc[m] = (acc[m]||0) + (+s.total||0);
    return acc;
  }, {});

  const totalSales   = sales.reduce((s,x)=>s+(+x.total||0), 0);
  const totalPaid    = sales.reduce((s,x)=>s+(+x.paid||0), 0);
  const totalDueAll  = sales.reduce((s,x)=>s+(+x.due||0), 0);

  const TABS = [
    { id:"summary", label:"সারাংশ" },
    { id:"monthly", label:"মাসিক" },
    { id:"sales",   label:"বিক্রয় তালিকা" },
  ];

  return (
    <div style={{ paddingBottom:80 }}>
      <TopBar title="📊 রিপোর্ট ও বিশ্লেষণ" onBack={onBack}/>

      {/* Tab bar */}
      <div style={{ display:"flex",background:T.surface,borderBottom:`1px solid ${T.border}` }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ flex:1,padding:"12px 4px",border:"none",background:"none",cursor:"pointer",
              fontWeight:tab===t.id?800:500,fontSize:13,color:tab===t.id?T.brand:T.textSub,
              borderBottom:`2px solid ${tab===t.id?T.brand:"transparent"}`,fontFamily:"inherit",transition:"all 0.2s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <div style={{ padding:40,textAlign:"center" }}><Spinner/></div> : (
        <div style={{ padding:16 }}>

          {/* ── সারাংশ ── */}
          {tab==="summary" && (
            <>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16 }}>
                {[
                  { l:"আজকের বিক্রয়",  v:taka(data?.todayTotal||0),  c:T.brand },
                  { l:"মাসের বিক্রয়",   v:taka(data?.monthTotal||0),  c:T.success },
                  { l:"মোট বাকি",       v:taka(data?.totalDue||0),    c:T.danger },
                  { l:"আজকের অর্ডার",   v:data?.todayOrders||0,        c:T.info },
                ].map((s,i)=>(
                  <Card key={i} style={{ textAlign:"center",padding:"16px 10px" }}>
                    <div style={{ fontSize:18,fontWeight:800,color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:11,color:T.textMuted,marginTop:4 }}>{s.l}</div>
                  </Card>
                ))}
              </div>

              {/* Payment method breakdown */}
              <Card style={{ marginBottom:14 }}>
                <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>💳 পেমেন্ট পদ্ধতি</div>
                {Object.entries(methodTotals).length===0
                  ? <div style={{ color:T.textMuted,fontSize:13 }}>কোনো বিক্রয় নেই</div>
                  : Object.entries(methodTotals).map(([m,v],i)=>(
                    <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border}`,fontSize:13 }}>
                      <span style={{ fontWeight:600 }}>{m}</span>
                      <span style={{ fontWeight:800,color:T.brand }}>{taka(v)}</span>
                    </div>
                  ))
                }
                <div style={{ display:"flex",justifyContent:"space-between",padding:"10px 0 0",fontSize:14,fontWeight:800 }}>
                  <span>মোট বিক্রয়</span>
                  <span style={{ color:T.brand }}>{taka(totalSales)}</span>
                </div>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,color:T.success }}>
                  <span>পরিশোধিত</span><span style={{ fontWeight:700 }}>{taka(totalPaid)}</span>
                </div>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,color:T.danger }}>
                  <span>বাকি</span><span style={{ fontWeight:700 }}>{taka(totalDueAll)}</span>
                </div>
              </Card>

              {/* Low stock */}
              {data?.lowStockItems?.length>0 && (
                <Card style={{ border:`1.5px solid ${T.warning}40` }}>
                  <div style={{ fontWeight:800,fontSize:14,color:T.warning,marginBottom:10 }}>⚠️ লো স্টক পণ্য</div>
                  {data.lowStockItems.map(p=>(
                    <div key={p.id} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.border}`,fontSize:13 }}>
                      <span>{p.name}</span>
                      <Badge color="warning">{p.stock} {p.unit}</Badge>
                    </div>
                  ))}
                </Card>
              )}
            </>
          )}

          {/* ── মাসিক বিক্রয় ── */}
          {tab==="monthly" && (
            <Card>
              <div style={{ fontWeight:800,fontSize:14,marginBottom:14 }}>📈 ৬ মাসের বিক্রয়</div>
              {!data?.chartData?.length
                ? <EmptyState icon="📊" title="কোনো ডেটা নেই" sub="বিক্রয় শুরু করলে চার্ট দেখাবে"/>
                : data.chartData.map((d,i)=>(
                  <div key={i} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4 }}>
                      <span style={{ fontWeight:700,color:T.text }}>{d.month}</span>
                      <span style={{ fontWeight:800,color:T.brand }}>{taka(d.sales)}</span>
                    </div>
                    <div style={{ height:10,background:`${T.brand}15`,borderRadius:5,overflow:"hidden" }}>
                      <div style={{ height:"100%",width:`${Math.round((d.sales/maxS)*100)}%`,background:T.brandGrad,borderRadius:5,transition:"width 0.5s" }}/>
                    </div>
                    <div style={{ fontSize:10,color:T.success,marginTop:2 }}>আনুমানিক লাভ: {taka(d.profit)}</div>
                  </div>
                ))
              }
            </Card>
          )}

          {/* ── বিক্রয় তালিকা ── */}
          {tab==="sales" && (
            <>
              <div style={{ fontSize:12,color:T.textMuted,marginBottom:10 }}>সর্বশেষ ৫০টি বিক্রয়</div>
              {!sales.length
                ? <EmptyState icon="🧾" title="কোনো বিক্রয় নেই" sub="POS থেকে বিক্রয় শুরু করুন"/>
                : sales.map(s=>(
                  <Card key={s.id} style={{ marginBottom:8,padding:"12px 14px" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                      <div>
                        <div style={{ fontWeight:700,fontSize:13 }}>{s.invoice_id}</div>
                        <div style={{ fontSize:11,color:T.textMuted }}>{s.customers?.name||"সাধারণ"} · {fmtDate(s.created_at)}</div>
                        <div style={{ fontSize:11,color:T.textSub,marginTop:2 }}>{s.payment_method}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontWeight:800,color:T.brand,fontSize:14 }}>{taka(s.total)}</div>
                        {+s.due>0 && <div style={{ fontSize:11,color:T.danger,fontWeight:700 }}>বাকি: {taka(s.due)}</div>}
                        <Badge color={s.status==="paid"?"success":s.status==="due"?"danger":"warning"}>
                          {s.status==="paid"?"পরিশোধ":s.status==="due"?"বাকি":"আংশিক"}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))
              }
            </>
          )}
        </div>
      )}
    </div>
  );
}
