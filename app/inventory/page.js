"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { T } from "@/lib/design";
import { Card, Btn, Avatar, Badge, ProgressBar, Input, Select, Spinner, EmptyState } from "@/lib/ui";
import { SvgIcon } from "@/lib/icons";
import { taka } from "@/lib/helpers";

// ── QR Modal — Responsive & Scrollable ───────────────────────
function QRModal({ product, shopName, onClose }) {
  const barcode = product.barcode || product.id;
  const qrData  = [
    "DIGIBOI", `ID:${barcode}`, `নাম:${product.name}`,
    product.brand ? `ব্র্যান্ড:${product.brand}` : "",
    product.categories?.name ? `ক্যাটাগরি:${product.categories.name}` : "",
    `মূল্য:${product.sell_price}৳`, shopName ? `দোকান:${shopName}` : "",
  ].filter(Boolean).join("|");
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}&margin=10`;

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"#fff",borderRadius:T.radiusLg,width:"100%",maxWidth:320,boxShadow:T.shadowLg,overflow:"hidden",maxHeight:"90vh",display:"flex",flexDirection:"column" }}>
        <div style={{ background:T.brandGrad,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0 }}>
          <div style={{ color:"#fff" }}>
            <div style={{ fontWeight:800,fontSize:14 }}>📦 পণ্য পরিচয়পত্র</div>
            {shopName && <div style={{ fontSize:11,opacity:.85 }}>{shopName}</div>}
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,padding:7,cursor:"pointer",color:"#fff",display:"flex" }}><SvgIcon icon="x" size={15}/></button>
        </div>
        <div style={{ overflowY:"auto",flex:1 }}>
          <div style={{ padding:"20px 20px 0",textAlign:"center" }}>
            <div style={{ background:"#F9FAFB",borderRadius:12,padding:12,marginBottom:16,display:"inline-block",border:`2px solid ${T.border}` }}>
              <img src={qrUrl} alt="QR" width={170} height={170} style={{ display:"block" }}/>
            </div>
            <div style={{ fontWeight:800,fontSize:16,color:T.text,marginBottom:4 }}>{product.name}</div>
            {product.brand && <div style={{ fontSize:12,color:T.textMuted,marginBottom:6 }}>{product.brand}</div>}
            <div style={{ fontSize:22,fontWeight:900,color:T.brand,marginBottom:12 }}>৳ {product.sell_price}</div>
          </div>
          <div style={{ margin:"0 16px 16px",background:"#F9FAFB",borderRadius:T.radiusSm,padding:"10px 14px" }}>
            {[
              { label:"বারকোড",    value: barcode },
              { label:"ক্যাটাগরি", value: product.categories?.name },
              { label:"স্টক",      value: `${product.stock} ${product.unit}` },
              { label:"ক্রয় মূল্য",value: product.buy_price ? `৳ ${product.buy_price}` : null },
              { label:"বিবরণ",     value: product.description },
            ].filter(r => r.value).map((r,i,a) => (
              <div key={i} style={{ display:"flex",justifyContent:"space-between",fontSize:12,padding:"5px 0",borderBottom:i<a.length-1?`1px solid ${T.border}`:"none" }}>
                <span style={{ color:T.textMuted }}>{r.label}</span>
                <span style={{ fontWeight:600,color:T.text,maxWidth:"60%",textAlign:"right",wordBreak:"break-word" }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:"flex",gap:10,padding:"0 16px 16px",flexShrink:0 }}>
          <Btn variant="secondary" full size="sm" onClick={onClose}>বন্ধ</Btn>
          <Btn variant="primary" full size="sm" onClick={() => window.print()}>🖨️ প্রিন্ট</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Product Modal ────────────────────────────────────────────
function ProductModal({ product, categories, suppliers, shopId, onClose, onSaved }) {
  const isEdit = !!product?.id;
  const [form, setForm] = useState({
    name:          product?.name          || "",
    brand:         product?.brand         || "",
    description:   product?.description   || "",
    categoryId:    product?.category_id   || "",
    supplierId:    product?.supplier_id   || "",
    sellPrice:     product?.sell_price    || "",
    buyPrice:      product?.buy_price     || "",
    stock:         product?.stock         || "",
    lowStockAlert: product?.low_stock_alert|| 5,
    unit:          product?.unit          || "পিস",
    customUnit:    "",
    barcode:       product?.barcode       || "",
    expiryDate:    product?.expiry_date   || "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const genBarcode = () => set("barcode", "890" + Math.floor(Math.random() * 10000000000).toString().padStart(10, "0"));

  const UNITS = ["পিস","কেজি","গ্রাম","লিটার","মিলিলিটার","বাক্স","প্যাকেট","ডজন","মিটার","অন্যান্য"];

  const validateStock = (val) => {
    const n = parseFloat(val);
    if (isNaN(n) || n < 0) return "স্টক সংখ্যা সঠিক নয়";
    return null;
  };

  const save = async () => {
    if (!form.name)      return setError("পণ্যের নাম দিন");
    if (!form.sellPrice) return setError("বিক্রয় মূল্য দিন");
    if (+form.sellPrice <= 0) return setError("বিক্রয় মূল্য ০ এর বেশি হতে হবে");
    const stockErr = validateStock(form.stock || "0");
    if (stockErr) return setError(stockErr);
    const finalUnit = form.unit === "অন্যান্য" ? (form.customUnit || "পিস") : form.unit;
    setSaving(true); setError("");
    try {
      const url    = isEdit ? `/api/products/${product.id}` : "/api/products";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers:{"Content-Type":"application/json"}, body: JSON.stringify({
        shopId, name:form.name, brand:form.brand||null, description:form.description||null,
        categoryId:form.categoryId||null, supplierId:form.supplierId||null,
        sellPrice:+form.sellPrice, sell_price:+form.sellPrice,
        buyPrice:+(form.buyPrice||0), buy_price:+(form.buyPrice||0),
        stock:parseFloat(form.stock||0), lowStockAlert:+(form.lowStockAlert||5),
        low_stock_alert:+(form.lowStockAlert||5), unit:finalUnit,
        barcode:form.barcode||null, expiryDate:form.expiryDate||null,
      })});
      const d = await res.json();
      if (d.success) { onSaved(d.data); onClose(); }
      else setError(d.error || "সংরক্ষণ ব্যর্থ");
    } catch { setError("সার্ভার সমস্যা"); }
    setSaving(false);
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end" }}>
      <div style={{ background:T.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:430,maxHeight:"92vh",overflowY:"auto",padding:20 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <h3 style={{ margin:0,fontWeight:800 }}>{isEdit?"পণ্য সম্পাদনা":"নতুন পণ্য যোগ"}</h3>
          <button onClick={onClose} style={{ background:`${T.danger}15`,border:"none",borderRadius:8,padding:8,cursor:"pointer",color:T.danger }}><SvgIcon icon="x" size={16}/></button>
        </div>
        {error && <div style={{ background:"#FEE2E2",borderRadius:T.radiusSm,padding:"8px 12px",marginBottom:12,fontSize:13,color:T.danger }}>⚠️ {error}</div>}

        <Input label="পণ্যের নাম *" value={form.name} onChange={v => set("name",v)} placeholder="পণ্যের নাম লিখুন"/>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <Input label="ব্র্যান্ড" value={form.brand} onChange={v => set("brand",v)} placeholder="ব্র্যান্ড"/>
          <Select label="ক্যাটাগরি" value={form.categoryId} onChange={v => set("categoryId",v)}
            options={[{value:"",label:"ক্যাটাগরি নির্বাচন"}, ...categories.map(c => ({value:c.id,label:c.name}))]}/>
        </div>

        {/* Description */}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block",fontSize:12,fontWeight:700,color:T.textSub,marginBottom:6 }}>পণ্যের বিবরণ (ঐচ্ছিক)</label>
          <textarea value={form.description} onChange={e => set("description",e.target.value)}
            placeholder="পণ্যের বিস্তারিত বিবরণ, বৈশিষ্ট্য, ব্যবহারবিধি..." rows={3}
            style={{ width:"100%",padding:"9px 12px",border:`1.5px solid ${T.border}`,borderRadius:T.radiusSm,fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none",boxSizing:"border-box",color:T.text,lineHeight:1.6 }}/>
          <div style={{ fontSize:11,color:T.textMuted,marginTop:4 }}>💡 বাংলা/ইংরেজি যেকোনো ফরম্যাটে লিখতে পারেন</div>
        </div>

        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <Input label="বিক্রয় মূল্য ৳ *" type="number" value={form.sellPrice} onChange={v => set("sellPrice",v)} placeholder="0" inputMode="decimal"/>
          <Input label="ক্রয় মূল্য ৳" type="number" value={form.buyPrice} onChange={v => set("buyPrice",v)} placeholder="0" inputMode="decimal"/>
        </div>

        {/* Stock + Unit */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <div>
            <Input label="স্টক পরিমাণ" type="number" value={form.stock} onChange={v => set("stock",v)} placeholder="0.00" inputMode="decimal"/>
            <div style={{ fontSize:10,color:T.textMuted,marginTop:-10,marginBottom:10 }}>দশমিক লেখা যাবে: ১২.৫</div>
          </div>
          <Select label="একক" value={form.unit} onChange={v => set("unit",v)} options={UNITS}/>
        </div>
        {form.unit === "অন্যান্য" && (
          <Input label="কাস্টম একক লিখুন" value={form.customUnit} onChange={v => set("customUnit",v)} placeholder="যেমন: বোতল, সাচেৎ..."/>
        )}

        <Input label="লো স্টক সীমা" type="number" value={form.lowStockAlert} onChange={v => set("lowStockAlert",v)} placeholder="5" inputMode="numeric"/>

        {/* Supplier */}
        {suppliers.length > 0 && (
          <Select label="সরবরাহকারী (ঐচ্ছিক)" value={form.supplierId} onChange={v => set("supplierId",v)}
            options={[{value:"",label:"সরবরাহকারী নির্বাচন করুন"}, ...suppliers.map(s => ({value:s.id,label:s.name}))]}/>
        )}

        <Input label="মেয়াদ উত্তীর্ণের তারিখ (ঐচ্ছিক)" type="date" value={form.expiryDate} onChange={v => set("expiryDate",v)}/>

        {/* Barcode */}
        <div style={{ display:"flex",gap:8,alignItems:"flex-end" }}>
          <div style={{ flex:1 }}>
            <Input label="বারকোড" value={form.barcode} onChange={v => set("barcode",v)} placeholder="স্বয়ংক্রিয় বা লিখুন"/>
          </div>
          <Btn variant="ghost" size="sm" onClick={genBarcode} style={{ marginBottom:14,whiteSpace:"nowrap" }}>🔀 অটো</Btn>
        </div>

        <div style={{ display:"flex",gap:10,marginTop:4 }}>
          <Btn variant="secondary" full onClick={onClose}>বাতিল</Btn>
          <Btn variant="primary" full onClick={save} disabled={saving}>{saving?"সংরক্ষণ হচ্ছে...":"✅ সংরক্ষণ করুন"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Barcode Scanner ───────────────────────────────────────────
function BarcodeScanner({ products, onFound, onClose }) {
  const [input, setInput]   = useState("");
  const [result, setResult] = useState(null);
  const [err,    setErr]    = useState("");
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const search = (val) => {
    setInput(val); setErr(""); setResult(null);
    if (val.length >= 4) {
      const found = products.find(p => p.barcode === val || p.barcode?.includes(val) || p.name.toLowerCase().includes(val.toLowerCase()));
      if (found) setResult(found);
      else if (val.length >= 8) setErr("পণ্য পাওয়া যায়নি");
    }
  };

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:T.surface,borderRadius:T.radiusLg,width:"100%",maxWidth:360,padding:24 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <h3 style={{ margin:0,fontWeight:800 }}>📷 বারকোড স্ক্যান</h3>
          <button onClick={onClose} style={{ background:`${T.danger}15`,border:"none",borderRadius:8,padding:8,cursor:"pointer",color:T.danger }}><SvgIcon icon="x" size={16}/></button>
        </div>
        <div style={{ background:`${T.brand}08`,borderRadius:T.radiusSm,padding:12,marginBottom:16,border:`1px solid ${T.brand}20`,fontSize:12,color:T.textSub }}>
          💡 বারকোড স্ক্যানার যুক্ত করুন বা নিচের বক্সে বারকোড/পণ্যের নাম লিখুন
        </div>
        <input ref={ref} value={input} onChange={e=>search(e.target.value)}
          placeholder="বারকোড নম্বর বা পণ্যের নাম..."
          style={{ width:"100%",padding:"12px 14px",border:`2px solid ${T.brand}`,borderRadius:T.radiusSm,fontSize:15,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:12 }}
          autoComplete="off"/>
        {err && <div style={{ color:T.danger,fontSize:13,marginBottom:12 }}>❌ {err}</div>}
        {result && (
          <div style={{ background:`${T.success}10`,borderRadius:T.radiusSm,padding:14,border:`1px solid ${T.success}30`,marginBottom:14 }}>
            <div style={{ fontWeight:800,fontSize:15,marginBottom:4 }}>✅ {result.name}</div>
            <div style={{ fontSize:13,color:T.textSub }}>মূল্য: {taka(result.sell_price)} | স্টক: {result.stock} {result.unit}</div>
            {result.barcode && <div style={{ fontSize:11,color:T.textMuted,marginTop:4 }}>বারকোড: {result.barcode}</div>}
            <Btn variant="primary" full onClick={() => { onFound(result); onClose(); }} style={{ marginTop:10 }}>
              এই পণ্য দেখুন
            </Btn>
          </div>
        )}
        <Btn variant="secondary" full onClick={onClose}>বন্ধ করুন</Btn>
      </div>
    </div>
  );
}

// ── Main Inventory ───────────────────────────────────────────
export default function InventoryPage({ user }) {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers,  setSuppliers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [selCat,     setSelCat]     = useState("সব");
  const [showAdd,    setShowAdd]    = useState(false);
  const [editProd,   setEditProd]   = useState(null);
  const [qrProd,     setQrProd]     = useState(null);
  const [showScanner,setShowScanner]= useState(false);
  const shopId = user?.shopId;

  const load = useCallback(() => {
    if (!shopId) return;
    Promise.all([
      fetch(`/api/products?shopId=${shopId}`).then(r=>r.json()),
      fetch(`/api/categories?shopId=${shopId}`).then(r=>r.json()),
      fetch(`/api/suppliers?shopId=${shopId}`).then(r=>r.json()),
    ]).then(([p,c,s]) => {
      if (p.success) setProducts(p.data||[]);
      if (c.success) setCategories(c.data||[]);
      if (s.success) setSuppliers(s.data||[]);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, [shopId]);

  useEffect(()=>{ load(); },[load]);

  const handleSaved = useCallback((prod) => {
    setProducts(prev => {
      const idx = prev.findIndex(p=>p.id===prod.id);
      if (idx>=0){ const a=[...prev]; a[idx]=prod; return a; }
      return [prod,...prev];
    });
  },[]);

  const handleDelete = async (id) => {
    if (!confirm("পণ্যটি মুছবেন?")) return;
    await fetch(`/api/products/${id}`,{method:"DELETE"});
    setProducts(prev=>prev.filter(p=>p.id!==id));
  };

  const filtered = products.filter(p =>
    (selCat==="সব" || p.categories?.name===selCat) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode||"").includes(search))
  );
  const catList = ["সব",...categories.map(c=>c.name)];

  if (loading) return <div style={{ padding:40,textAlign:"center" }}><Spinner/></div>;

  return (
    <div>
      {qrProd      && <QRModal product={qrProd} shopName={user?.shopName} onClose={()=>setQrProd(null)}/>}
      {showScanner && <BarcodeScanner products={products} onFound={p=>setQrProd(p)} onClose={()=>setShowScanner(false)}/>}
      {(showAdd||editProd) && (
        <ProductModal product={editProd} categories={categories} suppliers={suppliers}
          shopId={shopId} onClose={()=>{setShowAdd(false);setEditProd(null);}} onSaved={handleSaved}/>
      )}

      {/* Search bar */}
      <div style={{ padding:"12px 16px",background:T.surface,borderBottom:`1px solid ${T.border}`,display:"flex",gap:10,alignItems:"center" }}>
        <div style={{ flex:1,position:"relative" }}>
          <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:T.textMuted }}><SvgIcon icon="search" size={18}/></span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="পণ্য বা বারকোড খুঁজুন..."
            style={{ width:"100%",padding:"10px 12px 10px 40px",border:`1.5px solid ${T.border}`,borderRadius:T.radiusSm,fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box" }}/>
        </div>
        <button onClick={()=>setShowScanner(true)} style={{ padding:"10px 12px",background:`${T.brand}10`,border:`1.5px solid ${T.brand}30`,borderRadius:T.radiusSm,cursor:"pointer",color:T.brand,display:"flex",alignItems:"center" }}>
          <SvgIcon icon="scan" size={20}/>
        </button>
        <Btn variant="primary" size="sm" onClick={()=>setShowAdd(true)}>
          <SvgIcon icon="plus" size={16} color="#fff"/> যোগ
        </Btn>
      </div>

      {/* Category pills */}
      <div style={{ display:"flex",gap:8,padding:"8px 16px",overflowX:"auto",background:T.surface,borderBottom:`1px solid ${T.border}` }}>
        {catList.map(c=>(
          <button key={c} onClick={()=>setSelCat(c)} style={{ padding:"5px 14px",borderRadius:20,border:`1.5px solid ${selCat===c?T.brand:T.border}`,background:selCat===c?`${T.brand}10`:"transparent",color:selCat===c?T.brand:T.textSub,fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0 }}>{c}</button>
        ))}
      </div>

      <div style={{ padding:"12px 16px",paddingBottom:80 }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12 }}>
          {[
            { label:"মোট পণ্য",  value:products.length, color:T.info },
            { label:"লো স্টক",   value:products.filter(p=>+p.stock<=+p.low_stock_alert).length, color:T.warning },
            { label:"শূন্য স্টক", value:products.filter(p=>+p.stock===0).length, color:T.danger },
          ].map((s,i)=>(
            <div key={i} style={{ background:T.surface,borderRadius:T.radiusSm,padding:"10px",textAlign:"center",border:`1px solid ${T.border}` }}>
              <div style={{ fontWeight:800,fontSize:18,color:s.color }}>{s.value}</div>
              <div style={{ fontSize:10,color:T.textMuted }}>{s.label}</div>
            </div>
          ))}
        </div>

        {!filtered.length
          ? <EmptyState icon="📦" title="কোনো পণ্য নেই" sub="নতুন পণ্য যোগ করতে উপরের + বাটন চাপুন"/>
          : filtered.map(p=>{
            const pct   = Math.min(100,Math.round(+p.stock/Math.max(+p.low_stock_alert*2,1)*100));
            const isLow = +p.stock<=+p.low_stock_alert;
            const isOut = +p.stock===0;
            return (
              <Card key={p.id} style={{ marginBottom:10,padding:14 }}>
                <div style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
                  <Avatar name={p.name} size={46}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4 }}>
                      <div style={{ fontWeight:800,fontSize:14,flex:1,paddingRight:8,lineHeight:1.3 }}>{p.name}</div>
                      <div style={{ fontSize:16,fontWeight:800,color:T.brand,flexShrink:0 }}>{taka(p.sell_price)}</div>
                    </div>
                    {p.description && <div style={{ fontSize:11,color:T.textMuted,marginBottom:5,lineHeight:1.4 }}>{p.description.length>80?p.description.slice(0,80)+"…":p.description}</div>}
                    <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:6 }}>
                      {p.categories?.name && <Badge color="dark">{p.categories.name}</Badge>}
                      {p.brand && <Badge color="info">{p.brand}</Badge>}
                      <Badge color={isOut?"danger":isLow?"warning":"success"}>{p.stock} {p.unit}</Badge>
                      {isLow && !isOut && <Badge color="warning">⚠️ লো</Badge>}
                      {isOut && <Badge color="danger">শূন্য</Badge>}
                    </div>
                    {p.barcode && <div style={{ fontSize:11,color:T.textMuted,marginBottom:6 }}>🔖 {p.barcode}</div>}
                    <ProgressBar value={pct} max={100} color={isOut?T.danger:isLow?T.warning:T.success}/>
                    <div style={{ display:"flex",gap:6,marginTop:8 }}>
                      <Btn variant="ghost" size="sm" onClick={()=>setQrProd(p)}><SvgIcon icon="qr" size={14}/> QR</Btn>
                      <Btn variant="secondary" size="sm" onClick={()=>setEditProd(p)}><SvgIcon icon="edit" size={14}/> সম্পাদনা</Btn>
                      <Btn variant="danger" size="sm" onClick={()=>handleDelete(p.id)}><SvgIcon icon="trash" size={14}/></Btn>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        }
      </div>
    </div>
  );
}
