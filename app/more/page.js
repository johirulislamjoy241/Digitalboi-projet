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
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.shopId) { setLoading(false); return; }
    fetch(`/api/dashboard?shopId=${user.shopId}`)
      .then(r => r.json()).then(d => { if (d.success) setData(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user?.shopId]);

  const maxS = Math.max(...(data?.chartData || [{sales:1}]).map(d => d.sales), 1);

  return (
    <div style={{ paddingBottom:80 }}>
      <SubTopBar title="📊 রিপোর্ট ও বিশ্লেষণ" onBack={onBack}/>
      {loading ? <div style={{ padding:40, textAlign:"center" }}><Spinner/></div> : (
        <div style={{ padding:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
            {[
              { l:"মাসের বিক্রয়", v:taka(data?.monthTotal||0), c:T.brand },
              { l:"আজকের বিক্রয়", v:taka(data?.todayTotal||0), c:T.success },
              { l:"মোট বাকি",      v:taka(data?.totalDue||0),   c:T.warning },
              { l:"আজকের অর্ডার", v:data?.todayOrders||0,       c:T.info },
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
    name:"", phone:"", email:"", biz_type:"ফিজিক্যাল",
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
          biz_type:form.biz_type, division:form.division,
          district:form.district, upazila:form.upazila,
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

  if (loading) return <div style={{ padding:40, textAlign:"center" }}><Spinner/></div>;

  return (
    <div style={{ paddingBottom:80 }}>
      <SubTopBar title="⚙️ দোকান সেটিংস" onBack={onBack}/>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
      <div style={{ padding:16 }}>
        <Card style={{ marginBottom:12 }}>
          <div style={{ fontWeight:800, fontSize:14, marginBottom:14 }}>দোকানের তথ্য</div>
          <Input label="দোকানের নাম *" value={form.name||""} onChange={v => set("name",v)} placeholder="দোকানের নাম"/>
          <Input label="ফোন নম্বর" value={form.phone||""} onChange={v => set("phone",v)} placeholder="01XXXXXXXXX" inputMode="tel"/>
          <Input label="ইমেইল" type="email" value={form.email||""} onChange={v => set("email",v)} placeholder="shop@email.com"/>
          <Select label="ব্যবসার ধরন" value={form.biz_type||"ফিজিক্যাল"} onChange={v => set("biz_type",v)} options={["ফিজিক্যাল","অনলাইন","উভয়"]}/>
        </Card>
        <Card style={{ marginBottom:12 }}>
          <div style={{ fontWeight:800, fontSize:14, marginBottom:14 }}>ঠিকানা</div>
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
function AIPage({ onBack }) {
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(null);
  const TOOLS = [
    { id:"stock",    icon:"📦", label:"স্টক প্রেডিকশন",   desc:"চাহিদার পূর্বাভাস",    result:"✅ কোকা কোলা — রমজানে চাহিদা ৪০% বাড়বে\n⚠️ পেপসি ৫০০ml — মাত্র ৩টি বাকি\n✅ এরিয়েল — ঈদের আগে স্টক বাড়ান" },
    { id:"forecast", icon:"📈", label:"বিক্রয় ফোরকাস্ট", desc:"আগামী মাসের অনুমান",   result:"📊 আগামী মাসে আনুমানিক: ৳৭৫,০০০\n📈 গত মাসের তুলনায় ১০% বৃদ্ধি\n🎯 শুক্র-শনিবার সর্বোচ্চ বিক্রয়" },
    { id:"reorder",  icon:"🔄", label:"রিঅর্ডার সাজেশন", desc:"কি অর্ডার করবেন",      result:"📦 পেপসি ১L → ৫০ পিস অর্ডার করুন\n📦 এরিয়েল → ২০ কেজি অর্ডার\n📦 লেজ চিপস → ৩০ পিস মজুত করুন" },
    { id:"fraud",    icon:"🔍", label:"ফ্রড ডিটেকশন",     desc:"অস্বাভাবিক লেনদেন",   result:"✅ সব লেনদেন স্বাভাবিক\n⚠️ মোট বাকি ৳৮৪০ — কালেক্ট করুন\n🔍 কোনো অস্বাভাবিক প্যাটার্ন নেই" },
  ];
  const run = (t) => {
    setSelected(t.id); setLoading(true); setResult(null);
    setTimeout(() => { setLoading(false); setResult(t.result); }, 1600);
  };
  return (
    <div style={{ paddingBottom:80 }}>
      <SubTopBar title="🤖 AI টুলস" onBack={onBack}/>
      <div style={{ padding:16 }}>
        <div style={{ background:"linear-gradient(135deg,#1E1B4B,#312E81)", borderRadius:T.radiusLg, padding:20, marginBottom:16 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🤖</div>
          <div style={{ color:"#fff", fontWeight:800, fontSize:18 }}>Digiboi AI</div>
          <div style={{ color:"#A5B4FC", fontSize:13, marginTop:4 }}>আপনার ব্যবসার জন্য স্মার্ট বিশ্লেষণ</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          {TOOLS.map(t => (
            <Card key={t.id} onClick={() => run(t)} style={{ padding:14, border:`1.5px solid ${selected===t.id?T.purple:T.border}`, cursor:"pointer" }}>
              <div style={{ fontSize:26, marginBottom:6 }}>{t.icon}</div>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:2 }}>{t.label}</div>
              <div style={{ fontSize:11, color:T.textMuted }}>{t.desc}</div>
            </Card>
          ))}
        </div>
        {(loading||result) && (
          <Card style={{ border:`1.5px solid ${T.purple}30` }}>
            <div style={{ fontWeight:800, fontSize:14, marginBottom:10, color:T.purple }}>🤖 AI ফলাফল</div>
            {loading
              ? <div style={{ textAlign:"center", padding:24 }}><Spinner/><div style={{ fontSize:13, color:T.textSub, marginTop:10 }}>বিশ্লেষণ করছে...</div></div>
              : <pre style={{ whiteSpace:"pre-wrap", fontFamily:"inherit", fontSize:13, lineHeight:1.9, color:T.text, margin:0, background:`${T.purple}08`, padding:14, borderRadius:T.radiusSm }}>{result}</pre>
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
  if (sub === "ai")        return <AIPage onBack={() => setSub(null)}/>;
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
