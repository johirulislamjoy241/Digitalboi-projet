"use client";
import { useState, useEffect, useCallback } from "react";
import { T } from "@/lib/design";
import { Card, Btn, Avatar, Badge, Input, Select, Spinner, EmptyState } from "@/lib/ui";
import { SvgIcon } from "@/lib/icons";
import { taka, fmtDate } from "@/lib/helpers";

// ── Add/Edit Modal ────────────────────────────────────────────
function CustomerModal({ shopId, customer, onClose, onSaved }) {
  const isEdit = !!customer?.id;
  const [form, setForm] = useState({
    name:         customer?.name         || "",
    phone:        customer?.phone        || "",
    altPhone:     customer?.alt_phone    || "",
    email:        customer?.email        || "",
    nid:          customer?.nid          || "",
    dob:          customer?.dob          || "",
    gender:       customer?.gender       || "পুরুষ",
    address:      customer?.address      || "",
    reference:    customer?.reference    || "",
    notes:        customer?.notes        || "",
    customerType: customer?.customer_type|| "Regular",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const save = async () => {
    if (!form.name.trim()) return setError("নাম দিন");
    setSaving(true); setError("");
    try {
      const url    = isEdit ? `/api/customers/${customer.id}` : "/api/customers";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          shopId,
          name: form.name, phone: form.phone||null,
          alt_phone: form.altPhone||null, email: form.email||null,
          nid: form.nid||null, dob: form.dob||null,
          gender: form.gender, address: form.address||null,
          reference: form.reference||null, notes: form.notes||null,
          customer_type: form.customerType,
        })
      });
      const d = await res.json();
      if (d.success) { onSaved(d.data); onClose(); }
      else setError(d.error || "সংরক্ষণ ব্যর্থ");
    } catch { setError("সার্ভার সমস্যা"); }
    setSaving(false);
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end" }}>
      <div style={{ background:T.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:430,maxHeight:"92vh",overflowY:"auto",padding:20 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
          <h3 style={{ margin:0,fontWeight:800 }}>{isEdit?"কাস্টমার সম্পাদনা":"নতুন কাস্টমার"}</h3>
          <button onClick={onClose} style={{ background:`${T.danger}15`,border:"none",borderRadius:8,padding:8,cursor:"pointer",color:T.danger }}><SvgIcon icon="x" size={16}/></button>
        </div>
        <p style={{ color:T.textMuted,fontSize:12,marginBottom:16 }}>কাস্টমারের তথ্য দিন</p>
        {error && <div style={{ background:"#FEE2E2",borderRadius:T.radiusSm,padding:"8px 12px",marginBottom:12,fontSize:13,color:T.danger }}>{error}</div>}

        {/* Section: ব্যক্তিগত তথ্য */}
        <div style={{ fontSize:12,fontWeight:800,color:T.brand,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5 }}>👤 ব্যক্তিগত তথ্য</div>
        <Input label="পুরো নাম *" value={form.name} onChange={v => set("name",v)} placeholder="কাস্টমারের নাম"/>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <Input label="মোবাইল নম্বর" value={form.phone} onChange={v => set("phone",v)} placeholder="01XXXXXXXXX" inputMode="tel"/>
          <Input label="বিকল্প নম্বর (ঐচ্ছিক)" value={form.altPhone} onChange={v => set("altPhone",v)} placeholder="01XXXXXXXXX" inputMode="tel"/>
        </div>
        <Input label="ইমেইল (ঐচ্ছিক)" value={form.email} onChange={v => set("email",v)} placeholder="email@example.com" type="email"/>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <Input label="NID / জাতীয় পরিচয়পত্র (ঐচ্ছিক)" value={form.nid} onChange={v => set("nid",v)} placeholder="NID নম্বর" inputMode="numeric"/>
          <Select label="লিঙ্গ" value={form.gender} onChange={v => set("gender",v)} options={["পুরুষ","মহিলা","অন্যান্য"]}/>
        </div>
        <Input label="জন্ম তারিখ (ঐচ্ছিক)" value={form.dob} onChange={v => set("dob",v)} placeholder="DD/MM/YYYY"/>

        {/* Section: ঠিকানা */}
        <div style={{ fontSize:12,fontWeight:800,color:T.brand,margin:"8px 0",textTransform:"uppercase",letterSpacing:0.5 }}>📍 ঠিকানা ও রেফারেন্স</div>
        <Input label="ঠিকানা (ঐচ্ছিক)" value={form.address} onChange={v => set("address",v)} placeholder="গ্রাম / এলাকা / বাড়ি নম্বর..."/>
        <Input label="রেফারেন্স / অন্য আইডি (ঐচ্ছিক)" value={form.reference} onChange={v => set("reference",v)} placeholder="পাসপোর্ট, ড্রাইভিং লাইসেন্স ইত্যাদি"/>
        <Input label="নোট (ঐচ্ছিক)" value={form.notes} onChange={v => set("notes",v)} placeholder="বিশেষ তথ্য..."/>

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4 }}>
          <Select label="কাস্টমার ধরন" value={form.customerType} onChange={v => set("customerType",v)} options={["Regular","VIP"]}/>
        </div>

        <div style={{ display:"flex",gap:10,marginTop:8 }}>
          <Btn variant="secondary" full onClick={onClose}>বাতিল</Btn>
          <Btn variant="primary" full onClick={save} disabled={saving}>{saving?"সংরক্ষণ হচ্ছে...":"✅ সংরক্ষণ করুন"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Customer Profile Modal ───────────────────────────────────
function ProfileModal({ customer: initCustomer, shopId, onClose, onDueCollected }) {
  const [customer, setCustomer] = useState(initCustomer);
  const [sales,    setSales]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [amount,   setAmount]   = useState("");
  const [method,   setMethod]   = useState("নগদ");
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [tab,      setTab]      = useState("info"); // info | history

  useEffect(() => {
    fetch(`/api/sales?shopId=${shopId}&customerId=${customer.id}&limit=50`)
      .then(r=>r.json())
      .then(d=>{ if(d.success) setSales(d.data||[]); setLoading(false); })
      .catch(()=>setLoading(false));
  }, [customer.id, shopId]);

  const collect = async () => {
    const amt = parseFloat(amount);
    if (!amt||amt<=0) return setError("পরিমাণ সঠিকভাবে দিন");
    if (amt > parseFloat(customer.due_amount)) return setError(`বাকির চেয়ে বেশি নিতে পারবেন না। বর্তমান বাকি: ${taka(customer.due_amount)}`);
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ amount:amt, paymentMethod:method, shopId })
      });
      const d = await res.json();
      if (d.success) {
        const newDue = parseFloat(d.newDue.toFixed(2));
        setCustomer(c=>({...c, due_amount:newDue}));
        onDueCollected(customer.id, newDue);
        setAmount("");
        setError("");
      } else setError(d.error||"কালেকশন ব্যর্থ");
    } catch { setError("সার্ভার সমস্যা"); }
    setSaving(false);
  };

  // Calculate stats from sales
  const totalBought  = sales.reduce((s,x)=>s+(parseFloat(x.total)||0), 0);
  const totalDueSales= sales.reduce((s,x)=>s+(parseFloat(x.due)||0), 0);
  const paidCount    = sales.filter(x=>x.status==="paid").length;
  const dueCount     = sales.filter(x=>x.status==="due"||x.status==="partial").length;

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end" }}>
      <div style={{ background:T.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:430,maxHeight:"92vh",display:"flex",flexDirection:"column",overflow:"hidden" }}>
        {/* Handle */}
        <div style={{ display:"flex",justifyContent:"center",padding:"10px 0 0",flexShrink:0 }}>
          <div style={{ width:40,height:4,borderRadius:2,background:T.border }}/>
        </div>

        {/* Header */}
        <div style={{ background:T.brandGrad,margin:"8px 0 0",padding:"16px 20px",display:"flex",alignItems:"center",gap:14,flexShrink:0 }}>
          <Avatar name={customer.name} size={52} gradient={customer.customer_type==="VIP"?"linear-gradient(135deg,#F59E0B,#D97706)":T.brandGrad}/>
          <div style={{ flex:1,color:"#fff" }}>
            <div style={{ fontWeight:800,fontSize:17 }}>{customer.name}</div>
            {customer.customer_type==="VIP" && <Badge color="warning">⭐ VIP কাস্টমার</Badge>}
            <div style={{ fontSize:12,opacity:.85,marginTop:2 }}>{customer.phone||"নম্বর নেই"}</div>
            <div style={{ fontSize:11,opacity:.7,marginTop:1 }}>যোগ দিয়েছেন: {fmtDate(customer.created_at)}</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,padding:8,cursor:"pointer",color:"#fff" }}>
            <SvgIcon icon="x" size={16}/>
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,padding:"12px 16px 0",flexShrink:0 }}>
          {[
            { label:"মোট কেনা",  value:taka(customer.total_purchase||0), color:T.brand },
            { label:"মোট বাকি",  value:taka(customer.due_amount||0),     color:T.danger },
            { label:"পয়েন্ট",   value:customer.loyalty_points||0,        color:T.warning },
            { label:"অর্ডার",    value:sales.length,                      color:T.info },
          ].map((s,i)=>(
            <div key={i} style={{ background:`${s.color}10`,borderRadius:T.radiusSm,padding:"8px 4px",textAlign:"center",border:`1px solid ${s.color}20` }}>
              <div style={{ fontWeight:800,fontSize:12,color:s.color }}>{s.value}</div>
              <div style={{ fontSize:9,color:T.textMuted,marginTop:1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ display:"flex",borderBottom:`1px solid ${T.border}`,margin:"12px 0 0",flexShrink:0 }}>
          {[{id:"info",label:"📋 তথ্য"},{id:"history",label:"🧾 ক্রয় ইতিহাস"},{id:"due",label:"💰 বাকি"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ flex:1,padding:"10px 4px",border:"none",background:"none",cursor:"pointer",
                fontWeight:tab===t.id?800:500,fontSize:12,color:tab===t.id?T.brand:T.textSub,
                borderBottom:`2px solid ${tab===t.id?T.brand:"transparent"}`,fontFamily:"inherit" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY:"auto",flex:1,padding:"14px 20px 20px" }}>

          {/* ── তথ্য ── */}
          {tab==="info" && (
            <>
              <div style={{ background:T.bg,borderRadius:T.radiusSm,padding:"12px 14px",marginBottom:12 }}>
                {[
                  { label:"মোবাইল",    val:customer.phone },
                  { label:"বিকল্প নম্বর", val:customer.alt_phone },
                  { label:"ইমেইল",    val:customer.email },
                  { label:"NID",      val:customer.nid },
                  { label:"জন্ম তারিখ",val:customer.dob },
                  { label:"লিঙ্গ",    val:customer.gender },
                  { label:"ঠিকানা",   val:customer.address },
                  { label:"রেফারেন্স",val:customer.reference },
                  { label:"নোট",      val:customer.notes },
                  { label:"যোগের তারিখ",val:fmtDate(customer.created_at) },
                ].filter(r=>r.val).map((r,i)=>(
                  <div key={i} style={{ display:"flex",gap:8,fontSize:13,padding:"6px 0",borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ color:T.textMuted,minWidth:90,flexShrink:0 }}>{r.label}</span>
                    <span style={{ color:T.text,fontWeight:600,flex:1 }}>{r.val}</span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div style={{ background:`${T.brand}08`,borderRadius:T.radiusSm,padding:"12px 14px",border:`1px solid ${T.brand}15` }}>
                <div style={{ fontSize:12,fontWeight:700,color:T.brand,marginBottom:8 }}>📊 কেনাকাটার সারাংশ</div>
                {[
                  {l:"মোট বিক্রয়",  v:taka(totalBought),  c:T.brand},
                  {l:"পরিশোধিত",    v:taka(totalBought-totalDueSales), c:T.success},
                  {l:"বাকি",        v:taka(customer.due_amount||0), c:T.danger},
                  {l:"পরিশোধিত অর্ডার", v:paidCount+"টি", c:T.success},
                  {l:"বাকি অর্ডার",    v:dueCount+"টি",   c:T.danger},
                ].map((r,i)=>(
                  <div key={i} style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"5px 0",borderBottom:`1px solid ${T.border}` }}>
                    <span style={{ color:T.textMuted }}>{r.l}</span>
                    <span style={{ fontWeight:700,color:r.c }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── ক্রয় ইতিহাস ── */}
          {tab==="history" && (
            loading ? <div style={{ textAlign:"center",padding:30 }}><Spinner/></div>
            : !sales.length
            ? <div style={{ textAlign:"center",padding:"30px 0",color:T.textMuted }}>কোনো ক্রয় নেই</div>
            : sales.map(s=>(
              <div key={s.id} style={{ padding:"10px 0",borderBottom:`1px solid ${T.border}` }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontWeight:700,fontSize:13 }}>{s.invoice_id}</div>
                    <div style={{ fontSize:11,color:T.textMuted,marginTop:2 }}>{fmtDate(s.created_at)}</div>
                    <div style={{ fontSize:11,color:T.textSub }}>{s.payment_method}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontWeight:800,color:T.brand,fontSize:14 }}>{taka(s.total)}</div>
                    {parseFloat(s.due)>0 && <div style={{ fontSize:11,color:T.danger,fontWeight:600 }}>বাকি: {taka(s.due)}</div>}
                    <Badge color={s.status==="paid"?"success":s.status==="due"?"danger":"warning"}>
                      {s.status==="paid"?"পরিশোধ":s.status==="due"?"বাকি":"আংশিক"}
                    </Badge>
                  </div>
                </div>
                {/* Sale items */}
                {s.sale_items?.map((item,i)=>(
                  <div key={i} style={{ fontSize:11,color:T.textMuted,marginLeft:8,marginTop:2 }}>
                    • {item.product_name} × {item.quantity} = {taka(item.subtotal)}
                  </div>
                ))}
              </div>
            ))
          )}

          {/* ── বাকি কালেকশন ── */}
          {tab==="due" && (
            parseFloat(customer.due_amount)<=0
            ? <div style={{ textAlign:"center",padding:"30px 0" }}>
                <div style={{ fontSize:40,marginBottom:8 }}>✅</div>
                <div style={{ fontWeight:700,color:T.success }}>কোনো বাকি নেই</div>
              </div>
            : <>
                <div style={{ background:`${T.warning}10`,borderRadius:T.radiusSm,padding:"12px 14px",marginBottom:14,border:`1px solid ${T.warning}30` }}>
                  <div style={{ fontWeight:700,fontSize:14,color:T.warning }}>মোট বাকি: {taka(customer.due_amount)}</div>
                </div>
                {error && <div style={{ background:"#FEE2E2",borderRadius:T.radiusSm,padding:"8px 12px",marginBottom:12,fontSize:13,color:T.danger }}>⚠️ {error}</div>}
                <Input label="কালেকশন পরিমাণ ৳" type="number" value={amount} onChange={setAmount} placeholder="পরিমাণ (দশমিক দেওয়া যাবে)" inputMode="decimal"/>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:14 }}>
                  {["নগদ","বিকাশ","রকেট","কার্ড"].map(m=>(
                    <button key={m} onClick={()=>setMethod(m)}
                      style={{ padding:"8px 2px",borderRadius:6,border:`1.5px solid ${method===m?T.brand:T.border}`,background:method===m?`${T.brand}10`:"transparent",fontWeight:700,fontSize:12,color:method===m?T.brand:T.textSub,cursor:"pointer",fontFamily:"inherit" }}>
                      {m}
                    </button>
                  ))}
                </div>

                {/* Quick amount buttons */}
                <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:14 }}>
                  {[parseFloat(customer.due_amount), parseFloat(customer.due_amount)/2, 100].filter(v=>v>0).map((v,i)=>(
                    <button key={i} onClick={()=>setAmount(v.toFixed(2))}
                      style={{ padding:"7px 4px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bg,fontSize:11,color:T.textSub,cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>
                      {i===0?"সম্পূর্ণ":i===1?"অর্ধেক":""}{taka(v)}
                    </button>
                  ))}
                </div>

                <Btn variant="primary" full onClick={collect} disabled={saving}>
                  {saving?"কালেক্ট হচ্ছে...":"✅ কালেক্ট করুন"}
                </Btn>
              </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Due Collection Modal (list view) ─────────────────────────
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

// ── Main Customers Page ───────────────────────────────────────
export default function CustomersPage({ user }) {
  const [customers,   setCustomers]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [showAdd,     setShowAdd]     = useState(false);
  const [editCust,    setEditCust]    = useState(null);
  const [profileCust, setProfileCust] = useState(null);
  const [dueCust,     setDueCust]     = useState(null);
  const shopId = user?.shopId;

  const load = useCallback(() => {
    if (!shopId) return;
    fetch(`/api/customers?shopId=${shopId}&search=${encodeURIComponent(search)}`)
      .then(r => r.json())
      .then(d => { if (d.success) setCustomers(d.data||[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [shopId, search]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = useCallback((c) => {
    setCustomers(prev => {
      const idx = prev.findIndex(x => x.id === c.id);
      if (idx >= 0) { const a=[...prev]; a[idx]=c; return a; }
      return [c, ...prev];
    });
  }, []);
  const handleCollected = useCallback((id, newDue) =>
    setCustomers(prev => prev.map(c => c.id===id ? { ...c, due_amount:newDue } : c)), []);

  const totalDue = customers.reduce((s,c) => s + (+c.due_amount||0), 0);

  if (loading) return <div style={{ padding:40,textAlign:"center" }}><Spinner/></div>;

  return (
    <div>
      {showAdd     && <CustomerModal shopId={shopId} onClose={() => setShowAdd(false)}  onSaved={handleSaved}/>}
      {editCust    && <CustomerModal shopId={shopId} customer={editCust} onClose={() => setEditCust(null)} onSaved={handleSaved}/>}
      {profileCust && <ProfileModal customer={profileCust} shopId={shopId} onClose={() => setProfileCust(null)} onDueCollected={handleCollected}/>}
      {dueCust     && <DueModal customer={dueCust} shopId={shopId} onClose={() => setDueCust(null)} onCollected={handleCollected}/>}

      <div style={{ padding:"12px 16px",background:T.surface,borderBottom:`1px solid ${T.border}`,display:"flex",gap:10 }}>
        <div style={{ flex:1,position:"relative" }}>
          <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:T.textMuted }}><SvgIcon icon="users" size={18}/></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="নাম বা নম্বর দিয়ে খুঁজুন..." style={{ width:"100%",padding:"10px 12px 10px 40px",border:`1.5px solid ${T.border}`,borderRadius:T.radiusSm,fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box" }}/>
        </div>
        <Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}><SvgIcon icon="plus" size={16} color="#fff"/> যোগ</Btn>
      </div>

      <div style={{ padding:"12px 16px",paddingBottom:80 }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12 }}>
          {[
            { label:"মোট কাস্টমার", value:customers.length, color:T.info },
            { label:"VIP কাস্টমার", value:customers.filter(c=>c.customer_type==="VIP").length, color:T.warning },
            { label:"মোট বাকি",     value:taka(totalDue), color:T.danger },
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
            <Card key={c.id} style={{ marginBottom:10,padding:14 }} onClick={() => setProfileCust(c)}>
              <div style={{ display:"flex",gap:12,alignItems:"center" }}>
                <Avatar name={c.name} size={48} gradient={c.customer_type==="VIP"?"linear-gradient(135deg,#F59E0B,#D97706)":T.brandGrad}/>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:2 }}>
                    <div style={{ fontWeight:800,fontSize:15,color:T.text }}>{c.name}</div>
                    {c.customer_type==="VIP" && <Badge color="warning">⭐ VIP</Badge>}
                  </div>
                  <div style={{ fontSize:12,color:T.textMuted,marginBottom:4 }}>{c.phone||"নম্বর নেই"}{c.address?` · ${c.address}`:""}</div>
                  <div style={{ display:"flex",gap:12,flexWrap:"wrap" }}>
                    <div style={{ fontSize:12 }}><span style={{ color:T.textMuted }}>মোট কেনা: </span><strong style={{ color:T.text }}>{taka(c.total_purchase||0)}</strong></div>
                    <div style={{ fontSize:12 }}><span style={{ color:T.textMuted }}>পয়েন্ট: </span><strong style={{ color:T.brand }}>{c.loyalty_points||0}</strong></div>
                  </div>
                </div>
                <div onClick={e => { e.stopPropagation(); setEditCust(c); }} style={{ padding:8,cursor:"pointer",color:T.textMuted }}>
                  <SvgIcon icon="edit" size={16}/>
                </div>
              </div>
              {+c.due_amount > 0 && (
                <div style={{ marginTop:10,paddingTop:10,borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <span style={{ fontSize:13,color:T.danger,fontWeight:700 }}>বাকি: {taka(c.due_amount)}</span>
                  <Btn variant="warning" size="sm" onClick={e => { e.stopPropagation(); setDueCust(c); }}>💰 কালেক্ট করুন</Btn>
                </div>
              )}
            </Card>
          ))
        }
      </div>
    </div>
  );
}
