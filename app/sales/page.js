"use client";
import { useState, useEffect, useCallback } from "react";
import { T } from "@/lib/design";
import { Card, Badge, Btn, Spinner, EmptyState } from "@/lib/ui";
import { SvgIcon } from "@/lib/icons";
import { taka, fmtDate } from "@/lib/helpers";

function TopBar({ title, onBack }) {
  return (
    <div style={{ background:T.surface,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:50 }}>
      {onBack && <button onClick={onBack} style={{ background:`${T.brand}12`,border:"none",borderRadius:10,padding:8,cursor:"pointer",color:T.brand,display:"flex" }}><SvgIcon icon="back" size={18}/></button>}
      <h1 style={{ margin:0,fontSize:17,fontWeight:800,color:T.text }}>{title}</h1>
    </div>
  );
}

function DueCollectModal({ sale, shopId, onClose, onDone }) {
  const [amount, setAmount] = useState(sale?.due || "");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const collect = async () => {
    if (!amount || +amount <= 0) return setError("পরিমাণ দিন");
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/sales/${sale.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "collect_due", amount: +amount }),
      });
      const d = await res.json();
      if (d.success) { onDone(); onClose(); }
      else setError(d.error || "ব্যর্থ হয়েছে");
    } catch { setError("সার্ভার সমস্যা"); }
    setSaving(false);
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:T.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:430,padding:20 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
          <h3 style={{ margin:0,fontWeight:800 }}>💰 বাকি আদায়</h3>
          <button onClick={onClose} style={{ background:`${T.danger}15`,border:"none",borderRadius:8,padding:8,cursor:"pointer",color:T.danger }}><SvgIcon icon="x" size={16}/></button>
        </div>
        <div style={{ background:`${T.warning}10`,borderRadius:T.radiusSm,padding:"10px 14px",marginBottom:14,fontSize:13 }}>
          মোট বাকি: <strong style={{ color:T.warning }}>{taka(sale?.due || 0)}</strong>
        </div>
        {error && <div style={{ background:"#FEE2E2",borderRadius:T.radiusSm,padding:"8px 12px",marginBottom:12,fontSize:13,color:T.danger }}>{error}</div>}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:12,fontWeight:600,color:T.textMuted,display:"block",marginBottom:6 }}>পরিমাণ (৳)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="পরিমাণ লিখুন"
            style={{ width:"100%",padding:"12px 14px",border:`2px solid ${T.border}`,borderRadius:T.radius,fontSize:15,fontFamily:"inherit",outline:"none",boxSizing:"border-box" }} />
        </div>
        <div style={{ display:"flex",gap:6,marginBottom:14 }}>
          {[sale?.due, 500, 1000].filter((v,i,a) => v && v > 0 && a.indexOf(v) === i).slice(0,3).map(v => (
            <button key={v} onClick={() => setAmount(v)}
              style={{ flex:1,padding:"8px 4px",background:+amount===v ? `${T.brand}15` : T.bg,border:`1px solid ${+amount===v ? T.brand : T.border}`,borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",color:+amount===v ? T.brand : T.textMuted,fontFamily:"inherit" }}>
              {taka(v)}
            </button>
          ))}
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <Btn variant="secondary" full onClick={onClose}>বাতিল</Btn>
          <Btn variant="primary" full onClick={collect} disabled={saving}>{saving ? "সংরক্ষণ..." : "✅ নিশ্চিত"}</Btn>
        </div>
      </div>
    </div>
  );
}

export default function SalesHistoryPage({ onBack, user }) {
  const [sales,      setSales]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("all");
  const [search,     setSearch]     = useState("");
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");
  const [collectFor, setCollectFor] = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    if (!user?.shopId) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ shopId: user.shopId, limit: 100 });
      const res = await fetch("/api/sales?" + params);
      const d   = await res.json();
      setSales(d.success ? (d.data || []) : []);
    } catch { setSales([]); }
    setLoading(false);
  }, [user?.shopId]);

  useEffect(() => { load(); }, [load]);

  const filtered = sales.filter(s => {
    const matchFilter = filter === "all" || s.status === filter;
    const matchSearch = !search || s.invoice_id?.toLowerCase().includes(search.toLowerCase()) || s.customers?.name?.toLowerCase().includes(search.toLowerCase());
    const matchFrom   = !dateFrom || s.created_at >= dateFrom;
    const matchTo     = !dateTo   || s.created_at <= dateTo + "T23:59:59";
    return matchFilter && matchSearch && matchFrom && matchTo;
  });

  const totalSales = filtered.reduce((s, x) => s + (+x.total || 0), 0);
  const totalDue   = filtered.reduce((s, x) => s + (+x.due   || 0), 0);
  const totalPaid  = filtered.reduce((s, x) => s + (+x.paid  || 0), 0);

  const STATUS_COLOR = { paid:"success", due:"warning", partial:"info" };
  const STATUS_LABEL = { paid:"পরিশোধ", due:"বাকি", partial:"আংশিক" };

  return (
    <div style={{ paddingBottom:80 }}>
      <TopBar title="বিক্রয় ইতিহাস" onBack={onBack} />

      <div style={{ padding:"12px 16px 0" }}>
        {/* তারিখ ফিল্টার */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10 }}>
          <div>
            <label style={{ fontSize:11,fontWeight:600,color:T.textMuted,display:"block",marginBottom:4 }}>তারিখ থেকে</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} max={today}
              style={{ width:"100%",padding:"9px 10px",border:`2px solid ${T.border}`,borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box" }} />
          </div>
          <div>
            <label style={{ fontSize:11,fontWeight:600,color:T.textMuted,display:"block",marginBottom:4 }}>তারিখ পর্যন্ত</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} max={today}
              style={{ width:"100%",padding:"9px 10px",border:`2px solid ${T.border}`,borderRadius:10,fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box" }} />
          </div>
        </div>

        {/* Quick shortcuts */}
        <div style={{ display:"flex",gap:6,marginBottom:12,overflowX:"auto" }}>
          {[
            ["আজ",    today, today],
            ["এই সপ্তাহ", new Date(Date.now()-6*86400000).toISOString().slice(0,10), today],
            ["এই মাস",  new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10), today],
          ].map(([l, f, t]) => (
            <button key={l} onClick={() => { setDateFrom(f); setDateTo(t); }}
              style={{ padding:"6px 14px",background:dateFrom===f ? `${T.brand}12` : T.surface,color:dateFrom===f ? T.brand : T.textMuted,border:`1.5px solid ${dateFrom===f ? T.brand : T.border}`,borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit" }}>
              {l}
            </button>
          ))}
          <button onClick={() => { setDateFrom(""); setDateTo(""); }}
            style={{ padding:"6px 14px",background:T.bg,color:T.textMuted,border:`1.5px solid ${T.border}`,borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit" }}>
            সব
          </button>
        </div>

        {/* সারসংক্ষেপ */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14 }}>
          {[
            { l:"মোট বিক্রয়", v:taka(totalSales), c:T.brand },
            { l:"পরিশোধ",     v:taka(totalPaid),  c:T.success },
            { l:"বাকি",       v:taka(totalDue),   c:T.warning },
          ].map(s => (
            <Card key={s.l} style={{ padding:"12px 8px",textAlign:"center" }}>
              <div style={{ fontSize:15,fontWeight:800,color:s.c }}>{s.v}</div>
              <div style={{ fontSize:10,color:T.textMuted,marginTop:3 }}>{s.l}</div>
            </Card>
          ))}
        </div>

        {/* সার্চ */}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 ইনভয়েস বা গ্রাহকের নাম..."
          style={{ width:"100%",padding:"11px 16px",border:`2px solid ${T.border}`,borderRadius:12,fontSize:14,fontFamily:"inherit",outline:"none",marginBottom:10,boxSizing:"border-box",background:T.surface }} />

        {/* স্ট্যাটাস ফিল্টার */}
        <div style={{ display:"flex",gap:6,marginBottom:14 }}>
          {[["all","সব"],["paid","✅ পরিশোধ"],["due","⏳ বাকি"],["partial","~ আংশিক"]].map(([k,l]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{ padding:"6px 12px",border:`2px solid ${filter===k ? T.brand : T.border}`,borderRadius:20,fontSize:11,fontWeight:700,cursor:"pointer",background:filter===k ? `${T.brand}12` : T.surface,color:filter===k ? T.brand : T.textMuted,fontFamily:"inherit" }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* বিক্রয় তালিকা */}
      <div style={{ padding:"0 16px" }}>
        {loading ? (
          <div style={{ padding:40,textAlign:"center" }}><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="🛒" title="কোনো বিক্রয় নেই" sub="POS থেকে বিক্রয় শুরু করুন" />
        ) : (
          filtered.map(s => (
            <Card key={s.id} style={{ marginBottom:10,padding:"14px 16px" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8 }}>
                <div>
                  <div style={{ fontWeight:700,fontSize:14,color:T.text }}>{s.customers?.name || "সাধারণ গ্রাহক"}</div>
                  <div style={{ fontSize:11,color:T.textMuted,marginTop:2 }}>
                    {s.invoice_id} · {s.sale_items?.length || 0}টি পণ্য · {fmtDate(s.created_at)}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:800,fontSize:16,color:T.brand }}>{taka(s.total)}</div>
                  <Badge color={STATUS_COLOR[s.status] || "info"} style={{ marginTop:4 }}>
                    {STATUS_LABEL[s.status] || s.status}
                  </Badge>
                </div>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div style={{ display:"flex",gap:6 }}>
                  <span style={{ fontSize:11,color:T.textMuted,background:T.bg,padding:"3px 8px",borderRadius:6 }}>
                    {s.payment_method}
                  </span>
                  {s.paid > 0 && (
                    <span style={{ fontSize:11,color:T.success,background:`${T.success}10`,padding:"3px 8px",borderRadius:6 }}>
                      পরিশোধ {taka(s.paid)}
                    </span>
                  )}
                </div>
                {(+s.due) > 0 && (
                  <button onClick={() => setCollectFor(s)}
                    style={{ padding:"5px 12px",background:T.warning,border:"none",borderRadius:8,fontSize:12,color:"#fff",cursor:"pointer",fontWeight:700,fontFamily:"inherit" }}>
                    💰 {taka(s.due)} নিন
                  </button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* বাকি আদায় মডাল */}
      {collectFor && (
        <DueCollectModal
          sale={collectFor}
          shopId={user?.shopId}
          onClose={() => setCollectFor(null)}
          onDone={load}
        />
      )}
    </div>
  );
}
