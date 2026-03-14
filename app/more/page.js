"use client";
import { useState, useEffect, useCallback } from "react";
import { T, BD_DIVISIONS, BD_DISTRICTS, BD_UPAZILAS } from "@/lib/design";
import { Card, Btn, Badge, ProgressBar, Spinner, Input, Select, EmptyState } from "@/lib/ui";
import { SvgIcon } from "@/lib/icons";
import { taka, fmtDate } from "@/lib/helpers";
import ProfilePage from "@/app/profile/page";

function SubTopBar({ title, onBack }) {
  return (
    <div style={{ background:T.surface, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, borderBottom:`1px solid ${T.border}`, position:"sticky", top:0, zIndex:50, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
      <button onClick={onBack} style={{ background:`${T.brand}12`, border:"none", borderRadius:10, padding:8, cursor:"pointer", color:T.brand, display:"flex", alignItems:"center" }}>
        <SvgIcon icon="back" size={18}/>
      </button>
      <h2 style={{ margin:0, fontSize:17, fontWeight:800, color:T.text }}>{title}</h2>
    </div>
  );
}

// ── Toast helper ─────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const bg = type==="error" ? T.danger : T.success;
  return (
    <div style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", background:bg, color:"#fff", padding:"10px 20px", borderRadius:T.radiusSm, fontWeight:700, fontSize:13, zIndex:999, boxShadow:T.shadowMd, whiteSpace:"nowrap" }}>
      {msg}
    </div>
  );
}

// ── Reports ──────────────────────────────────────────────────
function ReportsPage({ user, onBack }) {
  const [data,    setData]    = useState(null);
  const [sales,   setSales]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("summary"); // "summary" | "history"
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    if (!user?.shopId) { setLoading(false); return; }
    Promise.all([
      fetch(`/api/dashboard?shopId=${user.shopId}`).then(r => r.json()),
      fetch(`/api/sales?shopId=${user.shopId}&limit=50`).then(r => r.json()),
    ]).then(([d, s]) => {
      if (d.success) setData(d.data);
      if (s.success) setSales(s.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.shopId]);

  const maxS = Math.max(...(data?.chartData || [{sales:1}]).map(d => d.sales), 1);

  const filteredSales = filter === "all" ? sales
    : sales.filter(s => s.status === filter);

  return (
    <div style={{ paddingBottom:80 }}>
      <SubTopBar title="📊 রিপোর্ট ও বিশ্লেষণ" onBack={onBack}/>
      {/* Tab bar */}
      <div style={{ display:"flex", background:T.surface, borderBottom:`1px solid ${T.border}` }}>
        {[["summary","📊 সারাংশ"],["history","🧾 বিক্রয় ইতিহাস"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ flex:1, padding:"12px 4px", border:"none", background:"none", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", color:tab===id?T.brand:T.textMuted, borderBottom:`2px solid ${tab===id?T.brand:"transparent"}`, transition:"all 0.2s" }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <div style={{ padding:40, textAlign:"center" }}><Spinner/></div> : (
        <div style={{ padding:16 }}>
          {tab === "summary" && (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                {[
                  { l:"মাসের বিক্রয়", v:taka(data?.monthTotal||0),  c:T.brand },
                  { l:"আজকের বিক্রয়", v:taka(data?.todayTotal||0),  c:T.success },
                  { l:"মোট বাকি",      v:taka(data?.totalDue||0),    c:T.warning },
                  { l:"আজকের অর্ডার", v:data?.todayOrders||0,        c:T.info },
                ].map((s,i) => (
                  <Card key={i} style={{ textAlign:"center", padding:"16px 10px" }}>
                    <div style={{ fontSize:20, fontWeight:800, color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>{s.l}</div>
                  </Card>
                ))}
              </div>
              {data?.chartData?.length > 0 && (
                <Card style={{ marginBottom:16 }}>
                  <div style={{ fontWeight:800, fontSize:14, marginBottom:14 }}>📈 মাসিক বিক্রয়</div>
                  {data.chartData.map((d,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                      <div style={{ width:40, fontSize:11, color:T.textMuted, fontWeight:600 }}>{d.month}</div>
                      <div style={{ flex:1 }}>
                        <ProgressBar value={d.sales} max={maxS} color={T.brand}/>
                        <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>{taka(d.sales)}</div>
                      </div>
                      <div style={{ fontSize:11, fontWeight:700, color:T.success, minWidth:56, textAlign:"right" }}>{taka(d.profit)}</div>
                    </div>
                  ))}
                </Card>
              )}
              {data?.lowStockItems?.length > 0 && (
                <Card style={{ marginBottom:16, border:`1.5px solid ${T.warning}40` }}>
                  <div style={{ fontWeight:800, fontSize:14, color:T.warning, marginBottom:10 }}>⚠️ লো স্টক পণ্য</div>
                  {data.lowStockItems.map(p => (
                    <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{p.name}</div>
                      <Badge color="warning">{p.stock} {p.unit} বাকি</Badge>
                    </div>
                  ))}
                </Card>
              )}
            </>
          )}

          {tab === "history" && (
            <>
              {/* Filter pills */}
              <div style={{ display:"flex", gap:8, marginBottom:14, overflowX:"auto" }}>
                {[["all","সব"],["paid","পরিশোধ"],["due","বাকি"],["partial","আংশিক"]].map(([v,l]) => (
                  <button key={v} onClick={() => setFilter(v)} style={{ padding:"6px 14px", borderRadius:20, border:`1.5px solid ${filter===v?T.brand:T.border}`, background:filter===v?`${T.brand}10`:"transparent", color:filter===v?T.brand:T.textSub, fontWeight:700, fontSize:12, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"inherit", flexShrink:0 }}>
                    {l}
                  </button>
                ))}
              </div>

              {/* Stats row */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                {[
                  { l:"মোট বিক্রয়", v:taka(filteredSales.reduce((s,x)=>s+(+x.total||0),0)), c:T.brand },
                  { l:"মোট লেনদেন",  v:filteredSales.length,                                  c:T.info },
                  { l:"মোট বাকি",    v:taka(filteredSales.reduce((s,x)=>s+(+x.due||0),0)),    c:T.warning },
                ].map((s,i) => (
                  <div key={i} style={{ background:T.surface, borderRadius:T.radiusSm, padding:"10px 8px", textAlign:"center", border:`1px solid ${T.border}` }}>
                    <div style={{ fontWeight:800, fontSize:13, color:s.c }}>{s.v}</div>
                    <div style={{ fontSize:10, color:T.textMuted }}>{s.l}</div>
                  </div>
                ))}
              </div>

              {!filteredSales.length
                ? <div style={{ textAlign:"center", padding:"40px 0", color:T.textMuted }}>কোনো বিক্রয় নেই</div>
                : filteredSales.map(s => (
                  <Card key={s.id} style={{ marginBottom:10, padding:"12px 14px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <div style={{ fontWeight:800, fontSize:14, color:T.text }}>{s.invoice_id}</div>
                        <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>
                          {s.customers?.name || "সাধারণ কাস্টমার"} · {s.payment_method}
                        </div>
                        <div style={{ fontSize:11, color:T.textMuted }}>{fmtDate(s.created_at)}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontWeight:800, fontSize:16, color:T.brand }}>{taka(s.total)}</div>
                        <Badge color={s.status==="paid"?"success":s.status==="due"?"warning":"info"}>
                          {s.status==="paid"?"✅ পরিশোধ":s.status==="due"?"⚠️ বাকি":"🔄 আংশিক"}
                        </Badge>
                        {+s.due > 0 && <div style={{ fontSize:11, color:T.warning, marginTop:4, fontWeight:700 }}>বাকি: {taka(s.due)}</div>}
                      </div>
                    </div>
                    {s.sale_items?.length > 0 && (
                      <div style={{ marginTop:10, paddingTop:8, borderTop:`1px solid ${T.border}` }}>
                        {s.sale_items.slice(0,3).map((item,i) => (
                          <div key={i} style={{ fontSize:11, color:T.textSub, display:"flex", justifyContent:"space-between" }}>
                            <span>{item.product_name || item.name} ×{item.quantity}</span>
                            <span>{taka((+item.unit_price||0)*(+item.quantity||1))}</span>
                          </div>
                        ))}
                        {s.sale_items.length > 3 && <div style={{ fontSize:10, color:T.textMuted }}>+{s.sale_items.length-3}টি আরও পণ্য</div>}
                      </div>
                    )}
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

// ── Expenses ─────────────────────────────────────────────────
function ExpensesPage({ user, onBack }) {
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [form,     setForm]     = useState({ category:"অন্যান্য", amount:"", note:"" });
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);
  const shopId = user?.shopId;

  const cats = ["ভাড়া","বেতন","বিদ্যুৎ","পরিবহন","মার্কেটিং","মেরামত","অন্যান্য"];

  useEffect(() => {
    if (!shopId) { setLoading(false); return; }
    fetch(`/api/expenses?shopId=${shopId}`)
      .then(r => r.json()).then(d => { if (d.success) setExpenses(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [shopId]);

  const save = async () => {
    if (!form.amount || +form.amount <= 0) return setToast({ msg:"পরিমাণ দিন", type:"error" });
    setSaving(true);
    try {
      const res = await fetch("/api/expenses", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ shopId, category:form.category, amount:+form.amount, note:form.note||null }) });
      const d = await res.json();
      if (d.success) {
        setExpenses(prev => [d.data, ...prev]);
        setForm({ category:"অন্যান্য", amount:"", note:"" });
        setShowAdd(false);
        setToast({ msg:"✅ খরচ যোগ হয়েছে", type:"success" });
      } else setToast({ msg: d.error || "ব্যর্থ", type:"error" });
    } catch { setToast({ msg:"সার্ভার সমস্যা", type:"error" }); }
    setSaving(false);
  };

  const total = expenses.reduce((s, e) => s + (+e.amount||0), 0);

  return (
    <div style={{ paddingBottom:80 }}>
      <SubTopBar title="💸 খরচ ব্যবস্থাপনা" onBack={onBack}/>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
      <div style={{ padding:16 }}>
        <div style={{ display:"flex", gap:10, marginBottom:16 }}>
          <Card style={{ flex:1, textAlign:"center", padding:"14px 10px" }}>
            <div style={{ fontSize:18, fontWeight:800, color:T.danger }}>{taka(total)}</div>
            <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>মোট খরচ</div>
          </Card>
          <Btn variant="primary" onClick={() => setShowAdd(true)} style={{ padding:"12px 16px" }}>
            + খরচ যোগ
          </Btn>
        </div>

        {showAdd && (
          <Card style={{ marginBottom:14, border:`1.5px solid ${T.brand}30` }}>
            <div style={{ fontWeight:800, fontSize:14, marginBottom:14 }}>নতুন খরচ</div>
            <Select label="ক্যাটাগরি" value={form.category} onChange={v => setForm(f=>({...f,category:v}))} options={cats}/>
            <Input label="পরিমাণ ৳ *" type="number" value={form.amount} onChange={v => setForm(f=>({...f,amount:v}))} placeholder="0" inputMode="numeric"/>
            <Input label="নোট (ঐচ্ছিক)" value={form.note} onChange={v => setForm(f=>({...f,note:v}))} placeholder="বিবরণ লিখুন"/>
            <div style={{ display:"flex", gap:8 }}>
              <Btn variant="secondary" full onClick={() => setShowAdd(false)}>বাতিল</Btn>
              <Btn variant="primary" full onClick={save} disabled={saving}>{saving?"সংরক্ষণ...":"✅ যোগ করুন"}</Btn>
            </div>
          </Card>
        )}

        {loading ? <Spinner/> : !expenses.length ? <EmptyState icon="💸" title="কোনো খরচ নেই" sub="খরচ যোগ করুন"/> : (
          expenses.map(e => (
            <Card key={e.id} style={{ marginBottom:8, padding:"12px 14px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:13 }}>{e.category}</div>
                  {e.note && <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>{e.note}</div>}
                  <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>{fmtDate(e.created_at)}</div>
                </div>
                <div style={{ fontWeight:800, fontSize:15, color:T.danger }}>{taka(e.amount)}</div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ── Suppliers ─────────────────────────────────────────────────
function SuppliersPage({ user, onBack }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [form,      setForm]      = useState({ name:"", phone:"", email:"", address:"" });
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);
  const shopId = user?.shopId;

  useEffect(() => {
    if (!shopId) { setLoading(false); return; }
    fetch(`/api/suppliers?shopId=${shopId}`)
      .then(r => r.json()).then(d => { if (d.success) setSuppliers(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [shopId]);

  const save = async () => {
    if (!form.name.trim()) return setToast({ msg:"সরবরাহকারীর নাম দিন", type:"error" });
    setSaving(true);
    try {
      const res = await fetch("/api/suppliers", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ shopId, name:form.name, phone:form.phone||null, email:form.email||null, address:form.address||null }) });
      const d = await res.json();
      if (d.success) {
        setSuppliers(prev => [...prev, d.data]);
        setForm({ name:"", phone:"", email:"", address:"" });
        setShowAdd(false);
        setToast({ msg:"✅ সরবরাহকারী যোগ হয়েছে", type:"success" });
      } else setToast({ msg: d.error || "ব্যর্থ", type:"error" });
    } catch { setToast({ msg:"সার্ভার সমস্যা", type:"error" }); }
    setSaving(false);
  };

  return (
    <div style={{ paddingBottom:80 }}>
      <SubTopBar title="🚚 সরবরাহকারী" onBack={onBack}/>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
      <div style={{ padding:16 }}>
        <Btn variant="primary" full onClick={() => setShowAdd(true)} style={{ marginBottom:14 }}>
          + নতুন সরবরাহকারী
        </Btn>

        {showAdd && (
          <Card style={{ marginBottom:14, border:`1.5px solid ${T.brand}30` }}>
            <div style={{ fontWeight:800, fontSize:14, marginBottom:14 }}>নতুন সরবরাহকারী</div>
            <Input label="নাম *" value={form.name} onChange={v => setForm(f=>({...f,name:v}))} placeholder="সরবরাহকারীর নাম"/>
            <Input label="মোবাইল" value={form.phone} onChange={v => setForm(f=>({...f,phone:v}))} placeholder="01XXXXXXXXX" inputMode="tel"/>
            <Input label="ইমেইল" type="email" value={form.email} onChange={v => setForm(f=>({...f,email:v}))} placeholder="email@example.com"/>
            <Input label="ঠিকানা" value={form.address} onChange={v => setForm(f=>({...f,address:v}))} placeholder="সরবরাহকারীর ঠিকানা"/>
            <div style={{ display:"flex", gap:8 }}>
              <Btn variant="secondary" full onClick={() => setShowAdd(false)}>বাতিল</Btn>
              <Btn variant="primary" full onClick={save} disabled={saving}>{saving?"সংরক্ষণ...":"✅ যোগ করুন"}</Btn>
            </div>
          </Card>
        )}

        {loading ? <Spinner/> : !suppliers.length ? <EmptyState icon="🚚" title="কোনো সরবরাহকারী নেই" sub="প্রথম সরবরাহকারী যোগ করুন"/> : (
          suppliers.map(s => (
            <Card key={s.id} style={{ marginBottom:8, padding:"14px" }}>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <div style={{ width:44, height:44, borderRadius:12, background:`${T.brand}12`, display:"flex", alignItems:"center", justifyContent:"center", color:T.brand, fontWeight:800, fontSize:18, flexShrink:0 }}>
                  {(s.name||"?")[0].toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:14 }}>{s.name}</div>
                  {s.phone && <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>📞 {s.phone}</div>}
                  {s.address && <div style={{ fontSize:11, color:T.textMuted }}>{s.address}</div>}
                </div>
                {s.due_amount > 0 && (
                  <Badge color="warning">{taka(s.due_amount)} বাকি</Badge>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ── Shop Settings ─────────────────────────────────────────────
function ShopSettingsPage({ user, onBack }) {
  const [form, setForm] = useState({
    name:"", phone:"", email:"", biz_type:"ফিজিক্যাল", biz_category:"",
    website:"", social_link:"", trade_license:"",
    division:"", district:"", upazila:"", post_code:"", address:""
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("digiboi_token") : "";

  const districts = BD_DISTRICTS[form.division] || [];
  const upazilas  = BD_UPAZILAS[form.district]  || [];

  useEffect(() => {
    fetch("/api/shop", { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setForm(f => ({ ...f, ...d.data })); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const save = async () => {
    if (!form.name?.trim()) return setToast({ msg:"দোকানের নাম দিন", type:"error" });
    setSaving(true);
    try {
      const res = await fetch("/api/shop", {
        method:"PATCH",
        headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({
          name:form.name, phone:form.phone, email:form.email,
          biz_type:form.biz_type, biz_category:form.biz_category,
          website:form.website, social_link:form.social_link,
          trade_license:form.trade_license,
          division:form.division, district:form.district, upazila:form.upazila,
          post_code:form.post_code, address:form.address,
        }),
      });
      const d = await res.json();
      if (d.success) setToast({ msg:"✅ দোকানের তথ্য আপডেট হয়েছে", type:"success" });
      else setToast({ msg: d.error || "আপডেট ব্যর্থ", type:"error" });
    } catch { setToast({ msg:"সার্ভার সমস্যা", type:"error" }); }
    setSaving(false);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const SHOP_CATS = ["মুদি দোকান","ঔষধ ফার্মেসি","কাপড় বস্ত্র","ইলেকট্রনিক্স","মোবাইল আনুষাঙ্গিক","রেস্তোরাঁ ফুড","বেকারি মিষ্টি","চা স্টল","সবজি তরকারি","মাছ মাংস","জুতা চামড়া","কসমেটিক্স সৌন্দর্য","হার্ডওয়ার নির্মাণ","স্টেশনারি বই","আসবাবপত্র","গ্যারেজ মোটর","কৃষি বীজ","পোল্ট্রি মৎস্য","অনলাইন শপ","অন্যান্য"];

  if (loading) return <div style={{ padding:40, textAlign:"center" }}><Spinner/></div>;

  return (
    <div style={{ paddingBottom:80 }}>
      <SubTopBar title="⚙️ দোকান সেটিংস" onBack={onBack}/>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
      <div style={{ padding:16 }}>
        <Card style={{ marginBottom:12 }}>
          <div style={{ fontWeight:800, fontSize:14, marginBottom:14 }}>🏪 দোকানের তথ্য</div>
          <Input label="দোকানের নাম *" value={form.name||""} onChange={v => set("name",v)} placeholder="দোকানের নাম"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <Select label="ব্যবসার ধরন" value={form.biz_type||"ফিজিক্যাল"} onChange={v => set("biz_type",v)} options={["ফিজিক্যাল","অনলাইন"]}/>
            <Select label="ক্যাটাগরি" value={form.biz_category||""} onChange={v => set("biz_category",v)} options={["",...SHOP_CATS]}/>
          </div>
          <Input label="ফোন নম্বর" value={form.phone||""} onChange={v => set("phone",v)} placeholder="01XXXXXXXXX" inputMode="tel"/>
          <Input label="ইমেইল" type="email" value={form.email||""} onChange={v => set("email",v)} placeholder="shop@email.com"/>
          <Input label="ওয়েবসাইট (ঐচ্ছিক)" value={form.website||""} onChange={v => set("website",v)} placeholder="https://yourshop.com"/>
          <Input label="সোশ্যাল লিংক (ঐচ্ছিক)" value={form.social_link||""} onChange={v => set("social_link",v)} placeholder="Facebook / Instagram লিংক"/>
          <Input label="ট্রেড লাইসেন্স (ঐচ্ছিক)" value={form.trade_license||""} onChange={v => set("trade_license",v)} placeholder="লাইসেন্স নম্বর"/>
        </Card>
        <Card style={{ marginBottom:12 }}>
          <div style={{ fontWeight:800, fontSize:14, marginBottom:14 }}>📍 ঠিকানা</div>
          <Select label="বিভাগ" value={form.division||""} onChange={v => { set("division",v); set("district",""); set("upazila",""); }}
            options={[{value:"",label:"বিভাগ নির্বাচন"}, ...BD_DIVISIONS.map(d=>({value:d,label:d}))]}/>
          {districts.length > 0 && (
            <Select label="জেলা" value={form.district||""} onChange={v => { set("district",v); set("upazila",""); }}
              options={[{value:"",label:"জেলা নির্বাচন"}, ...districts.map(d=>({value:d,label:d}))]}/>
          )}
          {upazilas.length > 0 && (
            <Select label="উপজেলা" value={form.upazila||""} onChange={v => set("upazila",v)}
              options={[{value:"",label:"উপজেলা নির্বাচন"}, ...upazilas.map(u=>({value:u,label:u}))]}/>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:10 }}>
            <Input label="ঠিকানা" value={form.address||""} onChange={v => set("address",v)} placeholder="রোড, এলাকা"/>
            <Input label="পোস্টকোড" value={form.post_code||""} onChange={v => set("post_code",v)} placeholder="1000" inputMode="numeric"/>
          </div>
        </Card>
        <Btn variant="primary" full onClick={save} disabled={saving} style={{ padding:14 }}>
          {saving ? "সংরক্ষণ হচ্ছে..." : "💾 পরিবর্তন সংরক্ষণ"}
        </Btn>
      </div>
    </div>
  );
}

// ── AI Tools ──────────────────────────────────────────────────
function AIPage({ user, onBack }) {
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(null);
  const [rawData,  setRawData]  = useState(null);
  const shopId = user?.shopId;

  useEffect(() => {
    if (!shopId) return;
    Promise.all([
      fetch(`/api/products?shopId=${shopId}`).then(r => r.json()),
      fetch(`/api/customers?shopId=${shopId}`).then(r => r.json()),
      fetch(`/api/sales?shopId=${shopId}&limit=50`).then(r => r.json()),
      fetch(`/api/dashboard?shopId=${shopId}`).then(r => r.json()),
    ]).then(([p, c, s, d]) => {
      setRawData({
        products:  p.success ? p.data : [],
        customers: c.success ? c.data : [],
        sales:     s.success ? s.data : [],
        dashboard: d.success ? d.data : {},
      });
    });
  }, [shopId]);

  const analyze = (toolId) => {
    if (!rawData) return;
    setSelected(toolId); setLoading(true); setResult(null);
    setTimeout(() => {
      const { products, customers, dashboard } = rawData;
      let lines = [];
      if (toolId === "stock") {
        const low  = products.filter(p => +p.stock <= +p.low_stock_alert);
        const zero = products.filter(p => +p.stock === 0);
        const ok   = products.filter(p => +p.stock > +p.low_stock_alert * 2);
        lines.push(`📦 মোট পণ্য: ${products.length}টি`);
        lines.push(`✅ পর্যাপ্ত স্টক: ${ok.length}টি`);
        if (zero.length) lines.push(`🔴 শূন্য স্টক: ${zero.map(p=>p.name).slice(0,3).join(", ")}`);
        if (low.length)  lines.push(`⚠️ লো স্টক: ${low.map(p=>`${p.name}(${p.stock})`).slice(0,4).join(", ")}`);
        if (!low.length && !zero.length) lines.push(`🎉 সব পণ্যে পর্যাপ্ত স্টক আছে`);
        if (low.length) lines.push(`
💡 এগুলো অর্ডার করুন: ${low.slice(0,2).map(p=>p.name).join(", ")}`);
      } else if (toolId === "forecast") {
        const total = dashboard.monthTotal || 0;
        const today = dashboard.todayTotal || 0;
        const orders = dashboard.todayOrders || 0;
        lines.push(`📊 মাসের মোট বিক্রয়: ৳${total.toLocaleString()}`);
        lines.push(`📈 আজকের বিক্রয়: ৳${today.toLocaleString()} (${orders}টি)`);
        lines.push(`💰 গড় অর্ডার: ৳${orders>0?Math.round(today/orders).toLocaleString():0}`);
        lines.push(`🎯 আনুমানিক আগামী মাস: ৳${Math.round(total*1.1).toLocaleString()}`);
        const top = [...products].sort((a,b)=>+b.sell_price - +a.sell_price).slice(0,3);
        if (top.length) lines.push(`
⭐ দামি পণ্য: ${top.map(p=>p.name).join(", ")}`);
      } else if (toolId === "reorder") {
        const low = products.filter(p => +p.stock <= +p.low_stock_alert);
        if (!low.length) { lines.push("✅ রিঅর্ডারের প্রয়োজন নেই"); lines.push("সব পণ্যে পর্যাপ্ত স্টক"); }
        else {
          lines.push(`📦 ${low.length}টি পণ্য রিঅর্ডার করুন:
`);
          low.slice(0,6).forEach(p => {
            const qty = Math.max(10, +p.low_stock_alert * 3);
            lines.push(`▶ ${p.name} → ${qty} ${p.unit}`);
            if (+p.buy_price) lines.push(`   খরচ: ৳${(qty * +p.buy_price).toLocaleString()}`);
          });
        }
      } else if (toolId === "customers") {
        const vip     = customers.filter(c => c.customer_type === "VIP");
        const withDue = customers.filter(c => +c.due_amount > 0);
        const totalDue = withDue.reduce((s,c) => s + +c.due_amount, 0);
        const top = [...customers].sort((a,b)=>+b.total_purchase - +a.total_purchase).slice(0,3);
        lines.push(`👥 মোট কাস্টমার: ${customers.length}জন`);
        lines.push(`⭐ VIP: ${vip.length}জন`);
        lines.push(`⚠️ বাকি: ${withDue.length}জনের, মোট ৳${totalDue.toLocaleString()}`);
        if (top.length) { lines.push(`
🏆 সেরা কাস্টমার:`); top.forEach(c => lines.push(`  ${c.name}: ৳${(+c.total_purchase||0).toLocaleString()}`)); }
        if (withDue.length) { lines.push(`
💰 বাকি কালেকশন:`); withDue.slice(0,3).forEach(c => lines.push(`  ${c.name}: ৳${(+c.due_amount).toLocaleString()}`)); }
      }
      setResult(lines.join("
")); setLoading(false);
    }, 1200);
  };

  const TOOLS = [
    { id:"stock",     icon:"📦", label:"স্টক বিশ্লেষণ",    desc:"লো স্টক ও শূন্য পণ্য" },
    { id:"forecast",  icon:"📈", label:"বিক্রয় ফোরকাস্ট", desc:"আজ ও এই মাসের সারাংশ" },
    { id:"reorder",   icon:"🔄", label:"রিঅর্ডার সাজেশন", desc:"কী অর্ডার করবেন" },
    { id:"customers", icon:"👥", label:"কাস্টমার বিশ্লেষণ", desc:"VIP, বাকি, সেরা ক্রেতা" },
  ];

  return (
    <div style={{ paddingBottom:80 }}>
      <SubTopBar title="🤖 AI টুলস" onBack={onBack}/>
      <div style={{ padding:16 }}>
        <div style={{ background:"linear-gradient(135deg,#1E1B4B,#312E81)", borderRadius:T.radiusLg, padding:20, marginBottom:16 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🤖</div>
          <div style={{ color:"#fff", fontWeight:800, fontSize:18 }}>Digiboi AI</div>
          <div style={{ color:"#A5B4FC", fontSize:13, marginTop:4 }}>আপনার আসল ডেটা বিশ্লেষণ করে পরামর্শ দেয়</div>
          {!rawData && <div style={{ color:"#A5B4FC", fontSize:12, marginTop:8 }}>⏳ ডেটা লোড হচ্ছে...</div>}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          {TOOLS.map(t => (
            <Card key={t.id} onClick={() => rawData && analyze(t.id)}
              style={{ padding:14, border:`1.5px solid ${selected===t.id?"#6366F1":T.border}`, cursor:rawData?"pointer":"not-allowed", opacity:rawData?1:0.6 }}>
              <div style={{ fontSize:26, marginBottom:6 }}>{t.icon}</div>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:2 }}>{t.label}</div>
              <div style={{ fontSize:11, color:T.textMuted }}>{t.desc}</div>
            </Card>
          ))}
        </div>
        {(loading||result) && (
          <Card style={{ border:"1.5px solid #6366F130" }}>
            <div style={{ fontWeight:800, fontSize:14, marginBottom:10, color:"#6366F1" }}>🤖 AI বিশ্লেষণ</div>
            {loading
              ? <div style={{ textAlign:"center", padding:24 }}><Spinner/><div style={{ fontSize:13, color:T.textSub, marginTop:10 }}>বিশ্লেষণ করছে...</div></div>
              : <pre style={{ whiteSpace:"pre-wrap", fontFamily:"inherit", fontSize:13, lineHeight:2, color:T.text, margin:0, background:"#F5F3FF", padding:14, borderRadius:T.radiusSm }}>{result}</pre>
            }
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Admin Panel ────────────────────────────────────────────────
function AdminPage({ user, onBack }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("shops");
  const token = typeof window !== "undefined" ? localStorage.getItem("digiboi_token") : "";

  useEffect(() => {
    fetch("/api/admin", { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setData(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const action = async (shopId, act) => {
    await fetch("/api/admin", { method:"PATCH", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`}, body:JSON.stringify({ shopId, action:act }) });
    setData(d => ({ ...d, shops: d.shops.map(s => s.id===shopId ? { ...s, status:act==="block"?"blocked":"active", is_active:act!=="block" } : s) }));
  };

  return (
    <div style={{ paddingBottom:80 }}>
      <SubTopBar title="🏢 অ্যাডমিন প্যানেল" onBack={onBack}/>
      {loading ? <div style={{ padding:40, textAlign:"center" }}><Spinner/></div> : (
        <div style={{ padding:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            {[
              { l:"মোট দোকান",        v:data?.totalShops||0,  c:T.info },
              { l:"সক্রিয়",          v:data?.activeShops||0, c:T.success },
              { l:"মোট রাজস্ব",      v:taka(data?.totalRevenue||0), c:T.brand },
              { l:"মোট ব্যবহারকারী", v:data?.users?.length||0, c:T.purple },
            ].map((s,i) => (
              <Card key={i} style={{ textAlign:"center", padding:"14px 10px" }}>
                <div style={{ fontSize:18, fontWeight:800, color:s.c }}>{s.v}</div>
                <div style={{ fontSize:11, color:T.textMuted }}>{s.l}</div>
              </Card>
            ))}
          </div>
          <div style={{ display:"flex", background:"#F0F2F8", borderRadius:10, padding:3, marginBottom:12 }}>
            {[{id:"shops",label:"দোকান"},{id:"users",label:"ইউজার"}].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, padding:9, borderRadius:8, border:"none", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:"inherit", background:tab===t.id?T.surface:"transparent", color:tab===t.id?T.brand:T.textSub, boxShadow:tab===t.id?"0 1px 4px rgba(0,0,0,.08)":"none" }}>{t.label}</button>
            ))}
          </div>
          {tab==="shops" && (data?.shops||[]).map(s => (
            <Card key={s.id} style={{ marginBottom:10, padding:14 }}>
              <div style={{ display:"flex", gap:10 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:T.brandGrad, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:16, flexShrink:0 }}>{(s.name||"?")[0]}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:13 }}>{s.name}</div>
                  <div style={{ fontSize:11, color:T.textMuted, marginBottom:6 }}>{s.users?.name} · {s.biz_type}</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <Badge color={s.plan==="Premium"?"brand":"dark"}>{s.plan}</Badge>
                    <Badge color={s.status==="active"?"success":s.status==="pending"?"warning":"danger"}>
                      {s.status==="active"?"সক্রিয়":s.status==="pending"?"পেন্ডিং":"ব্লক"}
                    </Badge>
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, flexDirection:"column" }}>
                  {s.status==="pending" && <Btn variant="success" size="sm" onClick={() => action(s.id,"approve")}>অনুমোদন</Btn>}
                  <Btn variant={s.status==="blocked"?"success":"danger"} size="sm" onClick={() => action(s.id, s.status==="blocked"?"unblock":"block")}>
                    {s.status==="blocked"?"আনব্লক":"ব্লক"}
                  </Btn>
                </div>
              </div>
            </Card>
          ))}
          {tab==="users" && (data?.users||[]).map(u => (
            <Card key={u.id} style={{ marginBottom:8, padding:12 }}>
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <div style={{ width:38, height:38, borderRadius:10, background:`${T.brand}15`, display:"flex", alignItems:"center", justifyContent:"center", color:T.brand, fontWeight:800, fontSize:15 }}>{(u.name||"?")[0]}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13 }}>{u.name}</div>
                  <div style={{ fontSize:11, color:T.textMuted }}>{u.phone}</div>
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
export default function MorePage({ user, onLogout, onUserUpdate }) {
  const [sub, setSub] = useState(null);

  if (sub === "profile")   return <ProfilePage   user={user} onBack={() => setSub(null)} onUserUpdate={onUserUpdate}/>;
  if (sub === "reports")   return <ReportsPage   user={user} onBack={() => setSub(null)}/>;
  if (sub === "expenses")  return <ExpensesPage  user={user} onBack={() => setSub(null)}/>;
  if (sub === "suppliers") return <SuppliersPage user={user} onBack={() => setSub(null)}/>;
  if (sub === "shop")      return <ShopSettingsPage user={user} onBack={() => setSub(null)}/>;
  if (sub === "ai")        return <AIPage user={user} onBack={() => setSub(null)}/>;
  if (sub === "admin")     return <AdminPage user={user} onBack={() => setSub(null)}/>;

  const MENU = [
    { id:"reports",   icon:"📊", label:"রিপোর্ট ও বিশ্লেষণ",  desc:"বিক্রয়, লাভ, চার্ট",        color:T.brand },
    { id:"expenses",  icon:"💸", label:"খরচ ব্যবস্থাপনা",       desc:"দৈনিক খরচ ট্র্যাক করুন",     color:T.danger },
    { id:"suppliers", icon:"🚚", label:"সরবরাহকারী",             desc:"সাপ্লাইয়ার তালিকা ও বাকি",  color:T.info },
    { id:"ai",        icon:"🤖", label:"AI টুলস",                desc:"স্মার্ট স্টক বিশ্লেষণ",       color:T.purple },
    { id:"shop",      icon:"🏪", label:"দোকান সেটিংস",           desc:"দোকানের তথ্য আপডেট",          color:T.success },
    { id:"admin",     icon:"🏢", label:"অ্যাডমিন প্যানেল",       desc:"সব দোকান পরিচালনা",           color:T.warning },
  ];

  return (
    <div style={{ paddingBottom:80 }}>
      {/* Profile card */}
      <div style={{ background:T.brandGrad, padding:"24px 16px 20px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
          <div style={{ width:56, height:56, borderRadius:16, background:"rgba(255,255,255,0.25)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:24, flexShrink:0, border:"2px solid rgba(255,255,255,0.4)" }}>
            {(user?.name||"?")[0]?.toUpperCase()}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ color:"#fff", fontWeight:800, fontSize:18 }}>{user?.name||"ব্যবহারকারী"}</div>
            <div style={{ color:"rgba(255,255,255,0.8)", fontSize:13 }}>{user?.shopName||"দোকান"}</div>
            <div style={{ color:"rgba(255,255,255,0.65)", fontSize:11, marginTop:2 }}>{user?.phone}</div>
          </div>
          <button onClick={() => setSub("profile")} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:10, padding:"8px 12px", cursor:"pointer", color:"#fff", fontSize:12, fontWeight:700, fontFamily:"inherit" }}>
            সম্পাদনা ✏️
          </button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.2)" }}>
          {[["Free","প্ল্যান"],["সক্রিয়","স্ট্যাটাস"],["v3.0","ভার্সন"]].map(([v,l],i) => (
            <div key={i} style={{ textAlign:"center" }}>
              <div style={{ color:"#fff", fontWeight:800, fontSize:14 }}>{v}</div>
              <div style={{ color:"rgba(255,255,255,0.7)", fontSize:10 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:"12px 16px" }}>
        {MENU.map(m => (
          <button key={m.id} onClick={() => setSub(m.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"16px", borderRadius:T.radius, background:T.surface, border:`1px solid ${T.border}`, cursor:"pointer", marginBottom:8, fontFamily:"inherit", textAlign:"left", boxShadow:T.shadow }}>
            <div style={{ width:42, height:42, borderRadius:12, background:`${m.color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{m.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14, color:T.text }}>{m.label}</div>
              <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>{m.desc}</div>
            </div>
            <span style={{ color:T.textMuted, fontSize:20 }}>›</span>
          </button>
        ))}

        <button onClick={onLogout} style={{ width:"100%", padding:"14px", borderRadius:T.radius, background:"#FEF2F2", border:`1px solid ${T.danger}25`, cursor:"pointer", fontWeight:700, fontSize:14, color:T.danger, display:"flex", alignItems:"center", gap:10, justifyContent:"center", marginTop:4, fontFamily:"inherit" }}>
          <SvgIcon icon="logout" size={18}/> লগআউট করুন
        </button>
      </div>
    </div>
  );
}
