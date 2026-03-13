"use client";
import { useState, useEffect, useCallback } from "react";
import { T } from "@/lib/design";
import { Card, Btn, Avatar, Badge, Input, Spinner, EmptyState } from "@/lib/ui";
import { SvgIcon } from "@/lib/icons";
import { taka } from "@/lib/helpers";

function AddModal({ shopId, onClose, onSaved }) {
  const [form,   setForm]   = useState({ name:"", phone:"", address:"" });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = (k,v) => setForm(f => ({ ...f,[k]:v }));

  const save = async () => {
    if (!form.name) return setError("নাম দিন");
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/customers", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ shopId, name:form.name, phone:form.phone||null, address:form.address||null }) });
      const d = await res.json();
      if (d.success) { onSaved(d.data); onClose(); }
      else setError(d.error || "যোগ ব্যর্থ");
    } catch { setError("সার্ভার সমস্যা"); }
    setSaving(false);
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end" }}>
      <div style={{ background:T.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:430,padding:20 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <h3 style={{ margin:0,fontWeight:800 }}>নতুন কাস্টমার</h3>
          <button onClick={onClose} style={{ background:`${T.danger}15`,border:"none",borderRadius:8,padding:8,cursor:"pointer",color:T.danger }}><SvgIcon icon="x" size={16}/></button>
        </div>
        {error && <div style={{ background:"#FEE2E2",borderRadius:T.radiusSm,padding:"8px 12px",marginBottom:12,fontSize:13,color:T.danger }}>{error}</div>}
        <Input label="নাম *" value={form.name} onChange={v => set("name",v)} placeholder="কাস্টমারের নাম"/>
        <Input label="মোবাইল নম্বর" value={form.phone} onChange={v => set("phone",v)} placeholder="01XXXXXXXXX" inputMode="tel"/>
        <Input label="ঠিকানা" value={form.address} onChange={v => set("address",v)} placeholder="ঠিকানা (ঐচ্ছিক)"/>
        <div style={{ display:"flex",gap:10,marginTop:4 }}>
          <Btn variant="secondary" full onClick={onClose}>বাতিল</Btn>
          <Btn variant="primary" full onClick={save} disabled={saving}>{saving?"যোগ হচ্ছে...":"✅ যোগ করুন"}</Btn>
        </div>
      </div>
    </div>
  );
}

function DueModal({ customer, shopId, onClose, onCollected }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("নগদ");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const collect = async () => {
    if (!amount || +amount <= 0) return setError("পরিমাণ দিন");
    if (+amount > +customer.due_amount) return setError("বাকির চেয়ে বেশি নিতে পারবেন না");
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/customers/${customer.id}`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ amount:+amount, paymentMethod:method, shopId }) });
      const d = await res.json();
      if (d.success) { onCollected(customer.id, d.newDue); onClose(); }
      else setError(d.error || "কালেকশন ব্যর্থ");
    } catch { setError("সার্ভার সমস্যা"); }
    setSaving(false);
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end" }}>
      <div style={{ background:T.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:430,padding:20 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <h3 style={{ margin:0,fontWeight:800 }}>বাকি কালেকশন</h3>
          <button onClick={onClose} style={{ background:`${T.danger}15`,border:"none",borderRadius:8,padding:8,cursor:"pointer",color:T.danger }}><SvgIcon icon="x" size={16}/></button>
        </div>
        <div style={{ background:`${T.warning}12`,borderRadius:T.radiusSm,padding:12,marginBottom:14,border:`1px solid ${T.warning}30` }}>
          <div style={{ fontWeight:700,fontSize:14 }}>{customer.name}</div>
          <div style={{ fontSize:13,color:T.warning,fontWeight:800 }}>মোট বাকি: {taka(customer.due_amount)}</div>
        </div>
        {error && <div style={{ background:"#FEE2E2",borderRadius:T.radiusSm,padding:"8px 12px",marginBottom:12,fontSize:13,color:T.danger }}>{error}</div>}
        <Input label="কালেকশন পরিমাণ ৳ *" type="number" value={amount} onChange={setAmount} placeholder="পরিমাণ লিখুন" inputMode="numeric"/>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block",fontSize:12,fontWeight:700,color:T.textSub,marginBottom:8 }}>পেমেন্ট পদ্ধতি</label>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8 }}>
            {["নগদ","বিকাশ","রকেট","কার্ড"].map(m => (
              <button key={m} onClick={() => setMethod(m)} style={{ padding:"9px 4px",borderRadius:8,border:`1.5px solid ${method===m?T.brand:T.border}`,background:method===m?`${T.brand}10`:"transparent",fontWeight:700,fontSize:12,color:method===m?T.brand:T.textSub,cursor:"pointer",fontFamily:"inherit" }}>{m}</button>
            ))}
          </div>
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <Btn variant="secondary" full onClick={onClose}>বাতিল</Btn>
          <Btn variant="primary" full onClick={collect} disabled={saving}>{saving?"কালেক্ট হচ্ছে...":"✅ কালেক্ট করুন"}</Btn>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage({ user }) {
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [showAdd,   setShowAdd]   = useState(false);
  const [dueCust,   setDueCust]   = useState(null);
  const shopId = user?.shopId;

  const load = useCallback(() => {
    if (!shopId) return;
    fetch(`/api/customers?shopId=${shopId}&search=${encodeURIComponent(search)}`)
      .then(r => r.json())
      .then(d => { if (d.success) setCustomers(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [shopId, search]);

  useEffect(() => { load(); }, [load]);

  const handleSaved     = useCallback(c  => setCustomers(prev => [c, ...prev]), []);
  const handleCollected = useCallback((id, newDue) => setCustomers(prev => prev.map(c => c.id===id ? { ...c, due_amount:newDue } : c)), []);

  const totalDue = customers.reduce((s,c) => s + (+c.due_amount||0), 0);

  if (loading) return <div style={{ padding:40,textAlign:"center" }}><Spinner/></div>;

  return (
    <div>
      {showAdd && <AddModal shopId={shopId} onClose={() => setShowAdd(false)} onSaved={handleSaved}/>}
      {dueCust  && <DueModal customer={dueCust} shopId={shopId} onClose={() => setDueCust(null)} onCollected={handleCollected}/>}

      {/* Search bar */}
      <div style={{ padding:"12px 16px",background:T.surface,borderBottom:`1px solid ${T.border}`,display:"flex",gap:10 }}>
        <div style={{ flex:1,position:"relative" }}>
          <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:T.textMuted }}><SvgIcon icon="users" size={18}/></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="নাম বা নম্বর দিয়ে খুঁজুন..." style={{ width:"100%",padding:"10px 12px 10px 40px",border:`1.5px solid ${T.border}`,borderRadius:T.radiusSm,fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box" }}/>
        </div>
        <Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}><SvgIcon icon="plus" size={16} color="#fff"/> যোগ</Btn>
      </div>

      <div style={{ padding:"12px 16px",paddingBottom:20 }}>
        {/* Stats */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12 }}>
          {[
            { label:"মোট কাস্টমার", value:customers.length,                                       color:T.info },
            { label:"VIP কাস্টমার", value:customers.filter(c=>c.customer_type==="VIP").length,    color:T.warning },
            { label:"মোট বাকি",     value:taka(totalDue),                                          color:T.danger },
          ].map((s,i) => (
            <div key={i} style={{ background:T.surface,borderRadius:T.radiusSm,padding:"10px",textAlign:"center",border:`1px solid ${T.border}` }}>
              <div style={{ fontWeight:800,fontSize:i===2?14:18,color:s.color }}>{s.value}</div>
              <div style={{ fontSize:10,color:T.textMuted }}>{s.label}</div>
            </div>
          ))}
        </div>

        {!customers.length
          ? <EmptyState icon="👥" title="কোনো কাস্টমার নেই" sub="নতুন কাস্টমার যোগ করুন"/>
          : customers.map(c => (
            <Card key={c.id} style={{ marginBottom:10,padding:14 }}>
              <div style={{ display:"flex",gap:12,alignItems:"center" }}>
                <Avatar name={c.name} size={48} gradient={c.customer_type==="VIP"?`linear-gradient(135deg,#F59E0B,#D97706)`:T.brandGrad}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:2 }}>
                    <div style={{ fontWeight:800,fontSize:15,color:T.text }}>{c.name}</div>
                    {c.customer_type==="VIP" && <Badge color="warning">⭐ VIP</Badge>}
                  </div>
                  <div style={{ fontSize:12,color:T.textMuted,marginBottom:6 }}>{c.phone||"নম্বর নেই"}{c.address?` · ${c.address}`:""}</div>
                  <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                    <div style={{ fontSize:12 }}><span style={{ color:T.textMuted }}>মোট কেনা: </span><strong style={{ color:T.text }}>{taka(c.total_purchase||0)}</strong></div>
                    <div style={{ fontSize:12 }}><span style={{ color:T.textMuted }}>পয়েন্ট: </span><strong style={{ color:T.brand }}>{c.loyalty_points||0}</strong></div>
                  </div>
                </div>
              </div>
              {+c.due_amount > 0 && (
                <div style={{ marginTop:10,paddingTop:10,borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <span style={{ fontSize:13,color:T.danger,fontWeight:700 }}>বাকি: {taka(c.due_amount)}</span>
                  <Btn variant="warning" size="sm" onClick={() => setDueCust(c)}>💰 কালেক্ট করুন</Btn>
                </div>
              )}
            </Card>
          ))
        }
      </div>
    </div>
  );
}
