"use client";
import { useState, useEffect, useCallback } from "react";
import { T } from "@/lib/design";
import { Card, Badge, Spinner, EmptyState } from "@/lib/ui";
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

export default function PaymentsPage({ onBack, user }) {
  const [tab,      setTab]      = useState("all");
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo,   setDateTo]   = useState(today);

  const load = useCallback(async () => {
    if (!user?.shopId) { setLoading(false); return; }
    setLoading(true);
    try {
      const token  = typeof window !== "undefined" ? localStorage.getItem("digiboi_token") : null;
      const params = new URLSearchParams({ from: dateFrom, to: dateTo });
      if (tab !== "all") params.append("type", tab);
      const res = await fetch("/api/payments?" + params, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const d = await res.json();
      setPayments(Array.isArray(d) ? d : []);
    } catch { setPayments([]); }
    setLoading(false);
  }, [user?.shopId, tab, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  // আয়/ব্যয় আলাদা করা
  const income  = payments.filter(p => p.category === "sale" || p.category === "customer_payment");
  const expense = payments.filter(p => p.category !== "sale" && p.category !== "customer_payment");
  const displayed = tab === "sale" ? income : tab === "expense" || tab === "purchase" ? expense : payments;

  const totalIn  = income.reduce((s, p)  => s + (+p.amount || 0), 0);
  const totalOut = expense.reduce((s, p) => s + (+p.amount || 0), 0);
  const balance  = totalIn - totalOut;

  const CAT_ICON  = { sale:"🛒", purchase:"📦", expense:"💸", customer_payment:"💰" };
  const CAT_LABEL = { sale:"বিক্রয়", purchase:"ক্রয়", expense:"খরচ", customer_payment:"পেমেন্ট" };

  return (
    <div style={{ paddingBottom:80 }}>
      <TopBar title="পেমেন্ট ও লেনদেন" onBack={onBack} />

      <div style={{ padding:"12px 16px 0" }}>
        {/* তারিখ ফিল্টার */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12 }}>
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

        {/* ব্যালেন্স কার্ড */}
        <div style={{ background:T.brandGrad,borderRadius:T.radiusLg,padding:"18px 20px",marginBottom:14 }}>
          <div style={{ fontSize:12,color:"rgba(255,255,255,0.7)",marginBottom:4 }}>নেট ব্যালেন্স</div>
          <div style={{ fontSize:30,fontWeight:800,color:"#fff",marginBottom:14 }}>
            {balance >= 0 ? "+" : ""}{taka(balance)}
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            <div style={{ background:"rgba(255,255,255,0.15)",borderRadius:12,padding:"10px 12px" }}>
              <div style={{ fontSize:10,color:"rgba(255,255,255,0.7)",marginBottom:3 }}>মোট আয়</div>
              <div style={{ fontSize:16,fontWeight:800,color:"#fff" }}>+{taka(totalIn)}</div>
            </div>
            <div style={{ background:"rgba(0,0,0,0.15)",borderRadius:12,padding:"10px 12px" }}>
              <div style={{ fontSize:10,color:"rgba(255,255,255,0.7)",marginBottom:3 }}>মোট ব্যয়</div>
              <div style={{ fontSize:16,fontWeight:800,color:"#fff" }}>−{taka(totalOut)}</div>
            </div>
          </div>
        </div>

        {/* ট্যাব */}
        <div style={{ display:"flex",background:T.bg,borderRadius:12,padding:4,marginBottom:14,gap:4 }}>
          {[["all","সব"],["sale","বিক্রয়"],["purchase","ক্রয়"],["expense","খরচ"]].map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ flex:1,padding:"9px 4px",border:"none",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",background:tab===k ? T.surface : "transparent",color:tab===k ? T.brand : T.textMuted,fontFamily:"inherit",boxShadow:tab===k ? T.shadow : "none" }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* লেনদেন তালিকা */}
      <div style={{ padding:"0 16px" }}>
        {loading ? (
          <div style={{ padding:40,textAlign:"center" }}><Spinner /></div>
        ) : displayed.length === 0 ? (
          <EmptyState icon="💳" title="কোনো লেনদেন নেই" sub="এই সময়ে কোনো লেনদেন পাওয়া যায়নি" />
        ) : (
          displayed.map(p => {
            const isIn = p.category === "sale" || p.category === "customer_payment";
            return (
              <Card key={p.id} style={{ marginBottom:10,padding:"13px 16px",borderLeft:`3px solid ${isIn ? T.success : T.danger}` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                    <div style={{ width:42,height:42,borderRadius:13,background:isIn ? `${T.success}15` : `${T.danger}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20 }}>
                      {CAT_ICON[p.category] || "💵"}
                    </div>
                    <div>
                      <div style={{ fontSize:13,fontWeight:700,color:T.text }}>
                        {CAT_LABEL[p.category] || "লেনদেন"}
                        {p.notes ? ` — ${p.notes}` : ""}
                      </div>
                      <div style={{ fontSize:11,color:T.textMuted,marginTop:2 }}>
                        {fmtDate(p.created_at)} · {p.payment_method}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize:16,fontWeight:800,color:isIn ? T.success : T.danger }}>
                    {isIn ? "+" : "−"}{taka(p.amount)}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
