"use client";
import { useState, useEffect, useCallback } from "react";
import { T } from "@/lib/design";
import { Card, Btn, Badge, Spinner } from "@/lib/ui";
import { SvgIcon } from "@/lib/icons";
import { taka, fmtDate } from "@/lib/helpers";

function TopBar({ title, onBack }) {
  return (
    <div style={{ background:T.surface,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:50 }}>
      <button onClick={onBack} style={{ background:`${T.brand}12`,border:"none",borderRadius:10,padding:8,cursor:"pointer",color:T.brand,display:"flex",alignItems:"center" }}><SvgIcon icon="back" size={18}/></button>
      <h2 style={{ margin:0,fontSize:17,fontWeight:800,color:T.text }}>{title}</h2>
    </div>
  );
}

// ════════════════════════════════════════════════
// 📊 REPORTS PAGE
// ════════════════════════════════════════════════
function ReportsPage({ onBack, user }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [period,  setPeriod]  = useState("month");

  const getRange = (p) => {
    const now   = new Date();
    const today = now.toISOString().slice(0, 10);
    if (p === "today") return { from: today, to: today };
    if (p === "week")  return { from: new Date(now - 6*86400000).toISOString().slice(0,10), to: today };
    return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10), to: today };
  };

  const load = useCallback((p) => {
    const pr = p || period;
    if (!user?.shopId) { setLoading(false); return; }
    setLoading(true); setError("");
    const { from, to } = getRange(pr);
    const token = typeof window !== "undefined" ? localStorage.getItem("digiboi_token") : null;
    fetch(`/api/reports?from=${from}&to=${to}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
        setLoading(false);
      })
      .catch(() => { setError("সার্ভার সমস্যা"); setLoading(false); });
  }, [user?.shopId, period]);

  useEffect(() => { load(); }, [user?.shopId]);

  const maxChart = Math.max(...(data?.monthlyChart || []).map(d => d.value), 1);

  return (
    <div style={{ paddingBottom:80 }}>
      <TopBar title="📊 রিপোর্ট ও বিশ্লেষণ" onBack={onBack}/>

      {/* পিরিয়ড */}
      <div style={{ padding:"12px 16px 0",display:"flex",gap:8 }}>
        {[["today","আজ"],["week","৭ দিন"],["month","এই মাস"]].map(([p,l]) => (
          <button key={p} onClick={() => { setPeriod(p); load(p); }}
            style={{ flex:1,padding:"9px 4px",border:`2px solid ${period===p?T.brand:T.border}`,borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",background:period===p?`${T.brand}12`:T.surface,color:period===p?T.brand:T.textMuted,fontFamily:"inherit" }}>
            {l}
          </button>
        ))}
      </div>

      {loading ? <div style={{ padding:40,textAlign:"center" }}><Spinner/></div> : error ? (
        <div style={{ margin:16,background:"#FEE2E2",borderRadius:T.radius,padding:"12px 16px",color:T.danger,fontSize:13 }}>
          ⚠️ {error} — <button onClick={() => load()} style={{ background:"none",border:"none",color:T.brand,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>আবার চেষ্টা</button>
        </div>
      ) : (
        <div style={{ padding:16 }}>

          {/* মূল ৪টি স্ট্যাট */}
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14 }}>
            {[
              { l:"মোট বিক্রয়",  v:taka(data?.totalSales  ||0), c:T.brand },
              { l:"নিট মুনাফা",   v:taka(data?.totalProfit ||0), c:data?.totalProfit>=0?T.success:T.danger },
              { l:"মোট বাকি",    v:taka(data?.totalDue    ||0), c:T.warning },
              { l:"মোট অর্ডার",  v:`${data?.totalOrders  ||0}টি`, c:T.info },
            ].map((s,i) => (
              <Card key={i} style={{ textAlign:"center",padding:"14px 10px" }}>
                <div style={{ fontSize:20,fontWeight:800,color:s.c }}>{s.v}</div>
                <div style={{ fontSize:11,color:T.textMuted,marginTop:4 }}>{s.l}</div>
              </Card>
            ))}
          </div>

          {/* বিস্তারিত আর্থিক হিসাব */}
          <Card style={{ marginBottom:14 }}>
            <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>💰 বিস্তারিত হিসাব</div>
            {[
              { l:"মোট বিক্রয়",      v:taka(data?.totalSales    ||0), c:T.text },
              { l:"পরিশোধ পেয়েছি",   v:taka(data?.totalPaid     ||0), c:T.success },
              { l:"বাকি আছে",         v:taka(data?.totalDue      ||0), c:T.warning },
              { l:"মোট ক্রয় (পার্চেজ)", v:taka(data?.totalPurchase||0), c:T.info },
              { l:"মোট খরচ (এক্সপেন্স)", v:taka(data?.totalExpenses||0), c:T.danger },
              { l:"গ্রস মুনাফা",       v:taka(data?.grossProfit   ||0), c:T.success },
              { l:"নিট মুনাফা",        v:taka(data?.totalProfit   ||0), c:data?.totalProfit>=0?T.success:T.danger, bold:true },
            ].map((r,i) => (
              <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<6?`1px solid ${T.border}`:"none" }}>
                <span style={{ fontSize:13,color:T.textMuted }}>{r.l}</span>
                <span style={{ fontSize:14,fontWeight:r.bold?800:700,color:r.c }}>{r.v}</span>
              </div>
            ))}
          </Card>

          {/* অর্ডার স্ট্যাটাস */}
          {data?.statusBreakdown && (
            <Card style={{ marginBottom:14 }}>
              <div style={{ fontWeight:800,fontSize:14,marginBottom:10 }}>📋 অর্ডার অবস্থা</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8 }}>
                {[
                  { l:"পরিশোধ",  v:data.statusBreakdown.paid    ||0, c:T.success },
                  { l:"বাকি",    v:data.statusBreakdown.due      ||0, c:T.warning },
                  { l:"আংশিক",  v:data.statusBreakdown.partial  ||0, c:T.info },
                ].map((s,i) => (
                  <div key={i} style={{ textAlign:"center",padding:"10px 6px",background:T.bg,borderRadius:10 }}>
                    <div style={{ fontWeight:800,fontSize:18,color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:10,color:T.textMuted,marginTop:2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* পেমেন্ট পদ্ধতি */}
          {data?.paymentMethods && Object.keys(data.paymentMethods).length > 0 && (
            <Card style={{ marginBottom:14 }}>
              <div style={{ fontWeight:800,fontSize:14,marginBottom:10 }}>💳 পেমেন্ট পদ্ধতি</div>
              {Object.entries(data.paymentMethods).sort((a,b)=>b[1]-a[1]).map(([m,amt],i) => (
                <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:13,fontWeight:600 }}>{m}</span>
                  <span style={{ fontSize:13,fontWeight:700,color:T.brand }}>{taka(amt)}</span>
                </div>
              ))}
            </Card>
          )}

          {/* চার্ট */}
          {data?.monthlyChart?.length > 0 && (
            <Card style={{ marginBottom:14 }}>
              <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>📈 বিক্রয় চার্ট</div>
              <div style={{ display:"flex",gap:5,alignItems:"flex-end",height:90 }}>
                {data.monthlyChart.map((d,i) => (
                  <div key={i} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
                    <div style={{ fontSize:8,color:T.brand,fontWeight:700,textAlign:"center" }}>
                      {d.value>=1000 ? (d.value/1000).toFixed(1)+"K" : d.value}
                    </div>
                    <div style={{ width:"100%",background:T.brandGrad,borderRadius:"4px 4px 0 0",height:Math.max(4,Math.round((d.value/maxChart)*74)),transition:"height 0.4s" }}/>
                    <div style={{ fontSize:8,color:T.textMuted,textAlign:"center" }}>{d.name}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* সেরা পণ্য */}
          {data?.topProducts?.length > 0 && (
            <Card style={{ marginBottom:14 }}>
              <div style={{ fontWeight:800,fontSize:14,marginBottom:10 }}>🏆 সেরা পণ্য</div>
              {data.topProducts.slice(0,5).map((p,i) => (
                <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${T.border}` }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ width:26,height:26,borderRadius:8,background:`${T.brand}15`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,color:T.brand }}>{i+1}</div>
                    <span style={{ fontSize:13,fontWeight:600 }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize:12,fontWeight:700,color:T.success,background:`${T.success}10`,padding:"3px 8px",borderRadius:6 }}>{p.qty} পিস</span>
                </div>
              ))}
            </Card>
          )}

          {/* লো স্টক */}
          {data?.lowStock?.length > 0 && (
            <Card style={{ border:`1.5px solid ${T.warning}40` }}>
              <div style={{ fontWeight:800,fontSize:14,color:T.warning,marginBottom:10 }}>⚠️ লো স্টক ({data.lowStock.length}টি)</div>
              {data.lowStock.slice(0,5).map((p,i) => (
                <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:13,fontWeight:600 }}>{p.name}</span>
                  <span style={{ fontSize:12,fontWeight:700,color:T.warning,background:`${T.warning}10`,padding:"3px 8px",borderRadius:6 }}>{p.stock} {p.unit||""} বাকি</span>
                </div>
              ))}
            </Card>
          )}

        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════
// 🧾 SALES HISTORY PAGE
// ════════════════════════════════════════════════
function SalesHistoryPage({ onBack, user }) {
  const [sales,      setSales]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("all");
  const [search,     setSearch]     = useState("");
  const [collectFor, setCollectFor] = useState(null);
  const [colAmt,     setColAmt]     = useState("");
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(() => {
    if (!user?.shopId) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/sales?shopId=${user.shopId}&limit=100`)
      .then(r => r.json())
      .then(d => { setSales(d.success ? (d.data || []) : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user?.shopId]);

  useEffect(() => { load(); }, [load]);

  const filtered = sales.filter(s =>
    (filter === "all" || s.status === filter) &&
    (!search || (s.invoice_id||"").toLowerCase().includes(search.toLowerCase()) || (s.customers?.name||"").toLowerCase().includes(search.toLowerCase()))
  );

  const totalSales = filtered.reduce((s,x) => s + (+x.total||0), 0);
  const totalDue   = filtered.reduce((s,x) => s + (+x.due  ||0), 0);
  const totalPaid  = filtered.reduce((s,x) => s + (+x.paid ||0), 0);

  const STATUS_LABEL = { paid:"✅ পরিশোধ", due:"⏳ বাকি", partial:"~ আংশিক" };
  const STATUS_COLOR = { paid:T.success, due:T.warning, partial:T.info };

  const collectDue = async () => {
    if (!colAmt || +colAmt <= 0 || !collectFor) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sales/${collectFor.id}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ action:"collect_due", amount:+colAmt })
      });
      const d = await res.json();
      if (d.success) { setCollectFor(null); setColAmt(""); load(); }
    } catch {}
    setSaving(false);
  };

  return (
    <div style={{ paddingBottom:80 }}>
      <TopBar title="🧾 বিক্রয় ইতিহাস" onBack={onBack}/>
      <div style={{ padding:"12px 16px 0" }}>
        {/* সারসংক্ষেপ */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12 }}>
          {[
            { l:"বিক্রয়",   v:taka(totalSales), c:T.brand },
            { l:"পরিশোধ",   v:taka(totalPaid),  c:T.success },
            { l:"বাকি",     v:taka(totalDue),   c:T.warning },
          ].map(s => (
            <Card key={s.l} style={{ padding:"10px",textAlign:"center" }}>
              <div style={{ fontSize:15,fontWeight:800,color:s.c }}>{s.v}</div>
              <div style={{ fontSize:10,color:T.textMuted,marginTop:2 }}>{s.l}</div>
            </Card>
          ))}
        </div>
        {/* সার্চ */}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ইনভয়েস বা গ্রাহকের নাম..."
          style={{ width:"100%",padding:"11px 16px",border:`2px solid ${T.border}`,borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",marginBottom:10,boxSizing:"border-box",background:T.surface }}/>
        {/* ফিল্টার */}
        <div style={{ display:"flex",gap:6,marginBottom:12,overflowX:"auto" }}>
          {[["all","সব"],["paid","পরিশোধ"],["due","বাকি"],["partial","আংশিক"]].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{ padding:"6px 12px",border:`2px solid ${filter===k?T.brand:T.border}`,borderRadius:20,fontSize:11,fontWeight:700,cursor:"pointer",background:filter===k?`${T.brand}12`:T.surface,color:filter===k?T.brand:T.textMuted,fontFamily:"inherit",whiteSpace:"nowrap" }}>
              {l} {k!=="all"?`(${sales.filter(s=>s.status===k).length})`:``}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding:"0 16px" }}>
        {loading ? <div style={{ padding:40,textAlign:"center" }}><Spinner/></div>
        : filtered.length === 0 ? <div style={{ padding:"40px 0",textAlign:"center",color:T.textMuted,fontSize:14 }}>কোনো বিক্রয় পাওয়া যায়নি</div>
        : filtered.map(s => (
          <Card key={s.id} style={{ marginBottom:10,padding:"14px 16px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6 }}>
              <div>
                <div style={{ fontWeight:700,fontSize:14 }}>{s.customers?.name||"সাধারণ গ্রাহক"}</div>
                <div style={{ fontSize:11,color:T.textMuted,marginTop:1 }}>{s.invoice_id} · {fmtDate(s.created_at)}</div>
                <div style={{ fontSize:11,color:T.textMuted }}>{s.sale_items?.length||0}টি পণ্য · {s.payment_method}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:800,fontSize:16,color:T.brand }}>{taka(s.total)}</div>
                <div style={{ fontSize:11,fontWeight:700,color:STATUS_COLOR[s.status]||T.info,marginTop:2 }}>
                  {STATUS_LABEL[s.status]||s.status}
                </div>
                {(+s.paid)>0 && (+s.due)>0 && (
                  <div style={{ fontSize:10,color:T.textMuted }}>পরিশোধ: {taka(s.paid)}</div>
                )}
              </div>
            </div>
            {(+s.due)>0 && (
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:8,borderTop:`1px solid ${T.border}` }}>
                <span style={{ fontSize:12,color:T.warning,fontWeight:700 }}>বাকি: {taka(s.due)}</span>
                <button onClick={() => { setCollectFor(s); setColAmt(s.due); }}
                  style={{ padding:"5px 14px",background:T.warning,border:"none",borderRadius:8,fontSize:12,color:"#fff",cursor:"pointer",fontWeight:700,fontFamily:"inherit" }}>
                  💰 কালেক্ট
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* বাকি আদায় মডাল */}
      {collectFor && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center" }} onClick={() => setCollectFor(null)}>
          <div style={{ background:T.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:430,padding:20 }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontWeight:800,fontSize:16,marginBottom:4 }}>💰 বাকি আদায়</div>
            <div style={{ fontSize:13,color:T.textMuted,marginBottom:14 }}>{collectFor.customers?.name||"সাধারণ গ্রাহক"} — মোট বাকি: <strong style={{ color:T.warning }}>{taka(collectFor.due)}</strong></div>
            <input type="number" value={colAmt} onChange={e=>setColAmt(e.target.value)} placeholder="পরিমাণ (৳)"
              style={{ width:"100%",padding:"12px",border:`2px solid ${T.border}`,borderRadius:T.radius,fontSize:15,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:12 }}/>
            <div style={{ display:"flex",gap:8,marginBottom:12 }}>
              {[collectFor.due, 500, 1000].filter((v,i,a)=>v>0&&a.indexOf(v)===i).slice(0,3).map(v=>(
                <button key={v} onClick={()=>setColAmt(v)}
                  style={{ flex:1,padding:"8px 4px",background:+colAmt===+v?`${T.brand}15`:T.bg,border:`1px solid ${+colAmt===+v?T.brand:T.border}`,borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",color:+colAmt===+v?T.brand:T.textMuted,fontFamily:"inherit" }}>
                  {taka(v)}
                </button>
              ))}
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>setCollectFor(null)} style={{ flex:1,padding:12,background:T.bg,border:"none",borderRadius:T.radius,fontSize:14,cursor:"pointer",fontWeight:700,fontFamily:"inherit" }}>বাতিল</button>
              <button onClick={collectDue} disabled={saving} style={{ flex:1,padding:12,background:T.brand,border:"none",borderRadius:T.radius,fontSize:14,color:"#fff",cursor:"pointer",fontWeight:700,fontFamily:"inherit" }}>{saving?"সংরক্ষণ...":"✅ নিশ্চিত"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AI Tools Sub-page ─────────────────────────────────────────
function AIPage({ onBack }) {
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(null);

  const MOCKS = {
    stock:    "✅ কোকা কোলা ও পেপসি — রমজানে চাহিদা ৪০% বাড়বে\n✅ এরিয়েল ডিটার্জেন্ট — ঈদের আগে স্টক বাড়ান\n⚠️ পেপসি ৫০০ml — মাত্র ৩টি বাকি, জরুরি অর্ডার করুন",
    forecast: "📊 আগামী মাসে আনুমানিক বিক্রয়: ৳৭৫,০০০\n📈 গত মাসের তুলনায় ১০% বৃদ্ধির সম্ভাবনা\n🎯 শুক্র-শনিবার সর্বোচ্চ বিক্রয় — প্রস্তুত থাকুন",
    reorder:  "📦 পেপসি ১L → এখনই ৫০ পিস অর্ডার করুন\n📦 এরিয়েল ডিটার্জেন্ট → ২০ কেজি অর্ডার করুন\n📦 লেজ চিপস → ৩০ পিস মজুত করুন",
    fraud:    "✅ সব লেনদেন স্বাভাবিক দেখাচ্ছে\n⚠️ ২ দিন ধরে মোট বাকি ৳৮৪০ — কালেক্ট করুন\n🔍 কোনো অস্বাভাবিক ছাড় বা প্যাটার্ন নেই",
    category: "🤖 AI সাজেশন:\n• পানীয় বিভাগে ৩টি নতুন পণ্য যোগ করুন\n• স্ন্যাকস বিভাগ সবচেয়ে বেশি বিক্রি হচ্ছে\n• গৃহস্থালি বিভাগে স্টক কম",
  };

  const run = (id) => {
    setSelected(id); setLoading(true); setResult(null);
    setTimeout(() => { setLoading(false); setResult(MOCKS[id]); }, 1800);
  };

  const TOOLS = [
    { id:"stock",    icon:"📦", label:"স্টক প্রেডিকশন",   desc:"চাহিদার পূর্বাভাস" },
    { id:"forecast", icon:"📈", label:"বিক্রয় ফোরকাস্ট", desc:"আগামী মাসের অনুমান" },
    { id:"reorder",  icon:"🔄", label:"রিঅর্ডার সাজেশন", desc:"কি অর্ডার করবেন" },
    { id:"fraud",    icon:"🔍", label:"ফ্রড ডিটেকশন",     desc:"অস্বাভাবিক লেনদেন" },
    { id:"category", icon:"🏷️", label:"অটো ক্যাটাগরি",   desc:"পণ্য শ্রেণিবিভাগ" },
  ];

  return (
    <div style={{ paddingBottom:80 }}>
      <TopBar title="🤖 AI টুলস" onBack={onBack}/>
      <div style={{ padding:16 }}>
        <div style={{ background:"linear-gradient(135deg,#1E1B4B,#312E81)",borderRadius:T.radiusLg,padding:20,marginBottom:16 }}>
          <div style={{ fontSize:32,marginBottom:8 }}>🤖</div>
          <div style={{ color:"#fff",fontWeight:800,fontSize:18 }}>Digiboi AI</div>
          <div style={{ color:"#A5B4FC",fontSize:13,marginTop:4 }}>আপনার ব্যবসার জন্য বুদ্ধিমান বিশ্লেষণ</div>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16 }}>
          {TOOLS.map(t => (
            <Card key={t.id} style={{ padding:14,border:`1.5px solid ${selected===t.id?T.purple:T.border}`,cursor:"pointer" }} onClick={() => run(t.id)}>
              <div style={{ fontSize:28,marginBottom:6 }}>{t.icon}</div>
              <div style={{ fontWeight:700,fontSize:13,color:T.text,marginBottom:2 }}>{t.label}</div>
              <div style={{ fontSize:11,color:T.textMuted,marginBottom:10 }}>{t.desc}</div>
              <Btn variant="ghost" size="sm" full style={{ color:T.purple,border:`1px solid ${T.purple}30` }}>বিশ্লেষণ করুন</Btn>
            </Card>
          ))}
        </div>
        {(loading || result) && (
          <Card style={{ border:`1.5px solid ${T.purple}30` }}>
            <div style={{ fontWeight:800,fontSize:14,marginBottom:12,color:T.purple }}>🤖 AI ফলাফল</div>
            {loading
              ? <div style={{ textAlign:"center",padding:24 }}>
                  <div style={{ width:36,height:36,border:`3px solid ${T.purple}30`,borderTop:`3px solid ${T.purple}`,borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 10px" }}/>
                  <div style={{ fontSize:13,color:T.textSub }}>বিশ্লেষণ করছে...</div>
                </div>
              : <pre style={{ whiteSpace:"pre-wrap",fontFamily:"inherit",fontSize:13,lineHeight:2,color:T.text,margin:0,background:`${T.purple}08`,padding:14,borderRadius:T.radiusSm }}>{result}</pre>
            }
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Loyalty Sub-page ─────────────────────────────────────────
function LoyaltyPage({ onBack }) {
  return (
    <div style={{ paddingBottom:80 }}>
      <TopBar title="🎁 লয়্যালটি প্রোগ্রাম" onBack={onBack}/>
      <div style={{ padding:16 }}>
        <Card style={{ background:"linear-gradient(135deg,#F59E0B,#D97706)",marginBottom:16 }}>
          <div style={{ color:"#fff",textAlign:"center" }}>
            <div style={{ fontSize:40,marginBottom:8 }}>🏆</div>
            <div style={{ fontWeight:800,fontSize:18 }}>পয়েন্ট সিস্টেম</div>
            <div style={{ fontSize:13,opacity:.85,marginTop:4 }}>প্রতি ৳১০ কেনায় ১ পয়েন্ট অর্জন</div>
          </div>
        </Card>
        <Card style={{ marginBottom:16 }}>
          <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>🎁 পুরস্কার ক্যাটালগ</div>
          {[
            { pts:100,  reward:"৳১০ ছাড়",            icon:"🏷️" },
            { pts:500,  reward:"৳৫০ ছাড়",            icon:"🎫" },
            { pts:1000, reward:"বিনামূল্যে ডেলিভারি", icon:"🚚" },
            { pts:2000, reward:"VIP মেম্বারশিপ",      icon:"👑" },
          ].map((r,i) => (
            <div key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:i<3?`1px solid ${T.border}`:"none" }}>
              <div style={{ fontSize:24 }}>{r.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:13 }}>{r.reward}</div>
                <div style={{ fontSize:11,color:T.brand }}>{r.pts} পয়েন্ট প্রয়োজন</div>
              </div>
              <Btn variant="ghost" size="sm">রিডিম</Btn>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontWeight:800,fontSize:14,marginBottom:10 }}>📋 নিয়মাবলী</div>
          {["প্রতি ৳১০ বিক্রয়ে ১ পয়েন্ট অর্জন","৳৫,০০০+ মোট কেনায় VIP স্ট্যাটাস","পয়েন্ট ১ বছর পর্যন্ত বৈধ","রিডিম করতে কাস্টমার ID প্রয়োজন"].map((r,i) => (
            <div key={i} style={{ fontSize:13,color:T.textSub,padding:"6px 0",borderBottom:i<3?`1px solid ${T.border}30`:"none" }}>• {r}</div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ── Admin Sub-page ────────────────────────────────────────────
function AdminPage({ onBack }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("shops");

  useEffect(() => {
    fetch("/api/admin").then(r => r.json())
      .then(d => { if (d.success) setData(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const action = async (shopId, act) => {
    await fetch("/api/admin", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ shopId, action:act }) });
    setData(d => ({ ...d, shops: d.shops.map(s => s.id===shopId ? { ...s, status: act==="block"?"blocked":"active", is_active: act!=="block" } : s) }));
  };

  return (
    <div style={{ paddingBottom:80 }}>
      <TopBar title="🏢 অ্যাডমিন প্যানেল" onBack={onBack}/>
      {loading ? <div style={{ padding:40,textAlign:"center" }}><Spinner/></div> : (
        <div style={{ padding:16 }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16 }}>
            {[
              { l:"মোট দোকান",       v:data?.totalShops||0,  c:T.info },
              { l:"সক্রিয় দোকান",   v:data?.activeShops||0, c:T.success },
              { l:"মোট রাজস্ব",     v:taka(data?.totalRevenue||0), c:T.brand },
              { l:"মোট ব্যবহারকারী", v:data?.users?.length||0, c:T.purple },
            ].map((s,i) => (
              <Card key={i} style={{ textAlign:"center",padding:"14px 10px" }}>
                <div style={{ fontSize:20,fontWeight:800,color:s.c }}>{s.v}</div>
                <div style={{ fontSize:11,color:T.textMuted }}>{s.l}</div>
              </Card>
            ))}
          </div>
          <div style={{ display:"flex",background:"#F0F2F8",borderRadius:10,padding:3,marginBottom:14 }}>
            {[{id:"shops",label:"দোকান"},{id:"users",label:"ব্যবহারকারী"}].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1,padding:9,borderRadius:8,border:"none",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit",background:tab===t.id?T.surface:"transparent",color:tab===t.id?T.brand:T.textSub,boxShadow:tab===t.id?"0 1px 4px rgba(0,0,0,.08)":"none" }}>{t.label}</button>
            ))}
          </div>
          {tab==="shops" && (data?.shops||[]).map(s => (
            <Card key={s.id} style={{ marginBottom:10,padding:14 }}>
              <div style={{ display:"flex",gap:10,alignItems:"flex-start" }}>
                <div style={{ width:44,height:44,borderRadius:12,background:T.brandGrad,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:18,flexShrink:0 }}>{(s.name||"?")[0]}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800,fontSize:14 }}>{s.name}</div>
                  <div style={{ fontSize:12,color:T.textMuted,marginBottom:6 }}>{s.users?.name} · {s.biz_type}</div>
                  <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                    <Badge color={s.plan==="Premium"?"brand":s.plan==="Basic"?"info":"dark"}>{s.plan}</Badge>
                    <Badge color={s.status==="active"?"success":s.status==="pending"?"warning":"danger"}>{s.status==="active"?"সক্রিয়":s.status==="pending"?"পেন্ডিং":"ব্লক"}</Badge>
                  </div>
                </div>
                <div style={{ display:"flex",gap:6,flexDirection:"column" }}>
                  {s.status==="pending" && <Btn variant="success" size="sm" onClick={() => action(s.id,"approve")}>অনুমোদন</Btn>}
                  <Btn variant={s.status==="blocked"?"success":"danger"} size="sm" onClick={() => action(s.id, s.status==="blocked"?"unblock":"block")}>{s.status==="blocked"?"আনব্লক":"ব্লক"}</Btn>
                </div>
              </div>
            </Card>
          ))}
          {tab==="users" && (data?.users||[]).map(u => (
            <Card key={u.id} style={{ marginBottom:8,padding:14 }}>
              <div style={{ display:"flex",gap:10,alignItems:"center" }}>
                <div style={{ width:40,height:40,borderRadius:10,background:`${T.brand}15`,display:"flex",alignItems:"center",justifyContent:"center",color:T.brand,fontWeight:800,fontSize:16 }}>{(u.name||"?")[0]}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700,fontSize:14 }}>{u.name}</div>
                  <div style={{ fontSize:11,color:T.textMuted }}>{u.phone}{u.email?` · ${u.email}`:""}</div>
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

// ── More Main ─────────────────────────────────────────────────
export default function MorePage({ user, setActive, onLogout }) {
  const [sub, setSub] = useState(null);

  if (sub === "reports")  return <ReportsPage      onBack={() => setSub(null)} user={user}/>;
  if (sub === "sales")    return <SalesHistoryPage onBack={() => setSub(null)} user={user}/>;
  if (sub === "ai")       return <AIPage       onBack={() => setSub(null)}/>;
  if (sub === "loyalty")  return <LoyaltyPage  onBack={() => setSub(null)}/>;
  if (sub === "admin")    return <AdminPage    onBack={() => setSub(null)}/>;

  const MENU = [
    { id:"sales",   icon:"🧾", label:"বিক্রয় ইতিহাস",      desc:"সব বিক্রয়, বাকি ও কালেকশন" },
    { id:"reports", icon:"📊", label:"রিপোর্ট ও বিশ্লেষণ", desc:"বিক্রয়, লাভ, চার্ট, ডাউনলোড" },
    { id:"ai",      icon:"🤖", label:"AI টুলস",             desc:"স্মার্ট স্টক ও বিক্রয় বিশ্লেষণ" },
    { id:"loyalty", icon:"🎁", label:"লয়্যালটি প্রোগ্রাম",  desc:"পয়েন্ট সিস্টেম ও পুরস্কার" },
    { id:"admin",   icon:"🏢", label:"অ্যাডমিন প্যানেল",     desc:"সব দোকান পরিচালনা" },
  ];

  return (
    <div style={{ paddingBottom:80 }}>
      <div style={{ padding:16 }}>
        {/* Profile card */}
        <Card style={{ marginBottom:16,background:T.brandGrad,color:"#fff",padding:20 }}>
          <div style={{ display:"flex",gap:14,alignItems:"center",marginBottom:16 }}>
            <div style={{ width:56,height:56,borderRadius:16,background:"rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:24,flexShrink:0 }}>
              {(user?.name||"?")[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight:800,fontSize:18 }}>{user?.name}</div>
              <div style={{ fontSize:13,opacity:.85 }}>{user?.shopName}</div>
              <div style={{ fontSize:11,opacity:.7,marginTop:2 }}>মালিক · {user?.phone}</div>
            </div>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,paddingTop:14,borderTop:"1px solid rgba(255,255,255,0.2)" }}>
            {[["Free","প্ল্যান"],["সক্রিয়","স্ট্যাটাস"],["v3.0","ভার্সন"]].map(([v,l],i) => (
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ fontWeight:800,fontSize:14 }}>{v}</div>
                <div style={{ fontSize:10,opacity:.7 }}>{l}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Menu items */}
        {MENU.map(m => (
          <button key={m.id} onClick={() => setSub(m.id)} style={{ width:"100%",display:"flex",alignItems:"center",gap:14,padding:"16px",borderRadius:T.radius,background:T.surface,border:`1px solid ${T.border}`,cursor:"pointer",marginBottom:8,fontFamily:"inherit",textAlign:"left",boxShadow:T.shadow }}>
            <div style={{ fontSize:24,width:36,textAlign:"center",flexShrink:0 }}>{m.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700,fontSize:14,color:T.text }}>{m.label}</div>
              <div style={{ fontSize:12,color:T.textMuted,marginTop:2 }}>{m.desc}</div>
            </div>
            <span style={{ color:T.textMuted,fontSize:20,flexShrink:0 }}>›</span>
          </button>
        ))}

        {/* Logout */}
        <button onClick={onLogout} style={{ width:"100%",padding:"14px",borderRadius:T.radius,background:"#FEF2F2",border:`1px solid ${T.danger}25`,cursor:"pointer",fontWeight:700,fontSize:14,color:T.danger,display:"flex",alignItems:"center",gap:10,justifyContent:"center",marginTop:8,fontFamily:"inherit" }}>
          <SvgIcon icon="logout" size={18}/> লগআউট করুন
        </button>
      </div>
    </div>
  );
}
