"use client";
import { useState, useEffect } from "react";
import { T } from "@/lib/design";
import { Card, Badge, Btn, Spinner } from "@/lib/ui";
import { SvgIcon } from "@/lib/icons";
import { taka } from "@/lib/helpers";

function TopBar({ title, onBack }) {
  return (
    <div style={{ background:T.surface,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:50 }}>
      {onBack && <button onClick={onBack} style={{ background:`${T.brand}12`,border:"none",borderRadius:10,padding:8,cursor:"pointer",color:T.brand,display:"flex" }}><SvgIcon icon="back" size={18}/></button>}
      <h1 style={{ margin:0,fontSize:17,fontWeight:800,color:T.text }}>{title}</h1>
    </div>
  );
}

export default function ReportsPage({ onBack, user }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState("month"); // today | week | month

  const getDateRange = (p) => {
    const now   = new Date();
    const today = now.toISOString().slice(0, 10);
    if (p === "today") return { from: today, to: today };
    if (p === "week") {
      const w = new Date(now - 6 * 86400000).toISOString().slice(0, 10);
      return { from: w, to: today };
    }
    const m = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    return { from: m, to: today };
  };

  const loadReport = async (p = period) => {
    if (!user?.shopId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { from, to } = getDateRange(p);
      const token = typeof window !== "undefined" ? localStorage.getItem("digiboi_token") : null;
      const res = await fetch(`/api/reports?from=${from}&to=${to}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const d = await res.json();
      setData(d);
    } catch { setData(null); }
    setLoading(false);
  };

  useEffect(() => { loadReport(); }, [user?.shopId, period]);

  const PERIODS = [
    { id: "today", label: "আজ" },
    { id: "week",  label: "৭ দিন" },
    { id: "month", label: "এই মাস" },
  ];

  const maxChart = Math.max(...(data?.monthlyChart || []).map(d => d.value), 1);

  return (
    <div style={{ paddingBottom: 80 }}>
      <TopBar title="📊 রিপোর্ট ও বিশ্লেষণ" onBack={onBack} />

      {/* Period Selector */}
      <div style={{ padding:"12px 16px 0",display:"flex",gap:8 }}>
        {PERIODS.map(p => (
          <button key={p.id} onClick={() => { setPeriod(p.id); loadReport(p.id); }}
            style={{ flex:1,padding:"9px 4px",border:`2px solid ${period===p.id ? T.brand : T.border}`,borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",background:period===p.id ? `${T.brand}12` : T.surface,color:period===p.id ? T.brand : T.textMuted,fontFamily:"inherit" }}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:40,textAlign:"center" }}><Spinner /></div>
      ) : (
        <div style={{ padding:16 }}>

          {/* মূল স্ট্যাটস */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16 }}>
            {[
              { l:"মোট বিক্রয়",   v: taka(data?.totalSales   || 0), c: T.brand,   icon:"cart" },
              { l:"মোট লাভ",      v: taka(data?.totalProfit  || 0), c: T.success, icon:"trending" },
              { l:"মোট বাকি",     v: taka(data?.totalDue     || 0), c: T.warning, icon:"alert" },
              { l:"মোট অর্ডার",   v: `${data?.totalOrders   || 0}টি`, c: T.info,  icon:"receipt" },
            ].map((s, i) => (
              <Card key={i} style={{ padding:"16px 14px" }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                  <div style={{ width:34,height:34,borderRadius:10,background:`${s.c}15`,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    <SvgIcon icon={s.icon} size={17} color={s.c} />
                  </div>
                </div>
                <div style={{ fontSize:20,fontWeight:800,color:s.c }}>{s.v}</div>
                <div style={{ fontSize:11,color:T.textMuted,marginTop:3 }}>{s.l}</div>
              </Card>
            ))}
          </div>

          {/* বিস্তারিত হিসাব */}
          <Card style={{ marginBottom:16 }}>
            <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>💰 আর্থিক সারসংক্ষেপ</div>
            {[
              { l:"মোট বিক্রয়",     v: taka(data?.totalSales    || 0), c: T.text },
              { l:"পরিশোধ পেয়েছি",  v: taka(data?.totalPaid     || 0), c: T.success },
              { l:"বাকি আছে",        v: taka(data?.totalDue      || 0), c: T.warning },
              { l:"মোট ক্রয় খরচ",   v: taka(data?.totalPurchase || 0), c: T.info },
              { l:"মোট খরচ",         v: taka(data?.totalExpenses || 0), c: T.danger },
              { l:"নিট মুনাফা",      v: taka(data?.totalProfit   || 0), c: data?.totalProfit >= 0 ? T.success : T.danger, bold: true },
            ].map((r, i) => (
              <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i < 5 ? `1px solid ${T.border}` : "none" }}>
                <span style={{ fontSize:13,color:T.textMuted }}>{r.l}</span>
                <span style={{ fontSize:14,fontWeight:r.bold?800:700,color:r.c }}>{r.v}</span>
              </div>
            ))}
          </Card>

          {/* পেমেন্ট পদ্ধতি */}
          {data?.paymentMethods && Object.keys(data.paymentMethods).length > 0 && (
            <Card style={{ marginBottom:16 }}>
              <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>💳 পেমেন্ট পদ্ধতি</div>
              {Object.entries(data.paymentMethods).map(([method, amount], i) => (
                <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:13,fontWeight:600 }}>{method}</span>
                  <span style={{ fontSize:13,fontWeight:700,color:T.brand }}>{taka(amount)}</span>
                </div>
              ))}
            </Card>
          )}

          {/* মাসিক চার্ট */}
          {data?.monthlyChart?.length > 0 && (
            <Card style={{ marginBottom:16 }}>
              <div style={{ fontWeight:800,fontSize:14,marginBottom:14 }}>📈 বিক্রয় চার্ট</div>
              <div style={{ display:"flex",gap:6,alignItems:"flex-end",height:90 }}>
                {data.monthlyChart.map((d, i) => (
                  <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
                    <div style={{ fontSize:9,color:T.brand,fontWeight:700 }}>{taka(d.value).replace("৳","")}</div>
                    <div style={{ width:"100%",background:T.brandGrad,borderRadius:"4px 4px 0 0",height:Math.max(6, Math.round((d.value/maxChart)*70)),transition:"height 0.4s" }} />
                    <div style={{ fontSize:9,color:T.textMuted }}>{d.name}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* সেরা পণ্য */}
          {data?.topProducts?.length > 0 && (
            <Card style={{ marginBottom:16 }}>
              <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>🏆 সেরা বিক্রীত পণ্য</div>
              {data.topProducts.slice(0, 5).map((p, i) => (
                <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${T.border}` }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ width:28,height:28,borderRadius:8,background:`${T.brand}15`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:T.brand }}>{i+1}</div>
                    <span style={{ fontSize:13,fontWeight:600 }}>{p.name}</span>
                  </div>
                  <Badge color="brand">{p.qty} পিস</Badge>
                </div>
              ))}
            </Card>
          )}

          {/* লো স্টক */}
          {data?.lowStock?.length > 0 && (
            <Card style={{ marginBottom:16,border:`1.5px solid ${T.warning}40` }}>
              <div style={{ fontWeight:800,fontSize:14,color:T.warning,marginBottom:10 }}>⚠️ লো স্টক ({data.lowStock.length}টি পণ্য)</div>
              {data.lowStock.slice(0, 5).map((p, i) => (
                <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:13,fontWeight:600 }}>{p.name}</span>
                  <Badge color="warning">{p.stock} বাকি</Badge>
                </div>
              ))}
            </Card>
          )}

          {/* ডাউনলোড */}
          <Card>
            <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>📥 রিপোর্ট ডাউনলোড</div>
            {[
              { l:"দৈনিক বিক্রয় রিপোর্ট", t:"CSV", c:T.success },
              { l:"মাসিক সারসংক্ষেপ",      t:"CSV", c:T.brand },
              { l:"ইনভেন্টরি রিপোর্ট",     t:"CSV", c:T.info },
            ].map((r, i) => (
              <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:13,fontWeight:600 }}>{r.l}</span>
                <Btn variant="secondary" size="sm" style={{ color:r.c }}>
                  <SvgIcon icon="download" size={14}/> {r.t}
                </Btn>
              </div>
            ))}
          </Card>

        </div>
      )}
    </div>
  );
}
