"use client";
import { useState, useEffect, useCallback } from "react";
import { T } from "@/lib/design";
import { Card, Btn, Avatar, Badge, ProgressBar, Input, Select, Spinner, EmptyState } from "@/lib/ui";
import { SvgIcon } from "@/lib/icons";
import { taka } from "@/lib/helpers";

// ── QR Modal ──────────────────────────────────────────────────
function QRModal({ product, onClose }) {
  const qrUrl = product.qr_code || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=DIGIBOI-${product.barcode || product.id}`;
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:T.surface,borderRadius:T.radiusLg,padding:24,textAlign:"center",width:"100%",maxWidth:300,boxShadow:T.shadowLg }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <span style={{ fontWeight:800,fontSize:15 }}>QR কোড</span>
          <button onClick={onClose} style={{ background:`${T.danger}15`,border:"none",borderRadius:8,padding:8,cursor:"pointer",color:T.danger }}><SvgIcon icon="x" size={16}/></button>
        </div>
        <img src={qrUrl} alt="QR" width={150} height={150} style={{ border:`2px solid ${T.border}`,borderRadius:8,marginBottom:12 }}/>
        <div style={{ fontWeight:700,fontSize:14,marginBottom:2 }}>{product.name}</div>
        <div style={{ fontSize:11,color:T.textMuted,marginBottom:4 }}>বারকোড: {product.barcode}</div>
        <div style={{ fontSize:15,fontWeight:800,color:T.brand,marginBottom:16 }}>{taka(product.sell_price)}</div>
        <div style={{ display:"flex",gap:8 }}>
          <Btn variant="secondary" full size="sm" onClick={onClose}>বন্ধ</Btn>
          <Btn variant="primary" full size="sm" onClick={() => window.print()}>🖨️ প্রিন্ট</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Product Modal ────────────────────────────────────────────
function ProductModal({ product, categories, shopId, onClose, onSaved }) {
  const isEdit = !!product?.id;
  const [form, setForm] = useState({
    name:          product?.name        || "",
    brand:         product?.brand       || "",
    categoryId:    product?.category_id || "",
    sellPrice:     product?.sell_price  || "",
    buyPrice:      product?.buy_price   || "",
    stock:         product?.stock       || "",
    lowStockAlert: product?.low_stock_alert || 5,
    unit:          product?.unit        || "পিস",
    barcode:       product?.barcode     || "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const genBarcode = () => set("barcode", "890" + Math.floor(Math.random() * 10000000000).toString().padStart(10, "0"));

  const save = async () => {
    if (!form.name)      return setError("পণ্যের নাম দিন");
    if (!form.sellPrice) return setError("বিক্রয় মূল্য দিন");
    setSaving(true); setError("");
    try {
      const url    = isEdit ? `/api/products/${product.id}` : "/api/products";
      const method = isEdit ? "PATCH" : "POST";
      const payload = {
        shopId,
        name: form.name, brand: form.brand || null,
        categoryId:     form.categoryId || null,
        category_id:    form.categoryId || null,
        sellPrice:      +form.sellPrice,   sell_price:      +form.sellPrice,
        buyPrice:       +(form.buyPrice||0), buy_price:     +(form.buyPrice||0),
        stock:          +(form.stock||0),
        lowStockAlert:  +(form.lowStockAlert||5), low_stock_alert: +(form.lowStockAlert||5),
        unit:           form.unit,
        barcode:        form.barcode || null,
      };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d   = await res.json();
      if (d.success) { onSaved(d.data); onClose(); }
      else setError(d.error || "সংরক্ষণ ব্যর্থ");
    } catch { setError("সার্ভার সমস্যা"); }
    setSaving(false);
  };

  const units = ["পিস","কেজি","লিটার","বাক্স","প্যাকেট","ডজন","গ্রাম","মিটার"];

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end" }}>
      <div style={{ background:T.surface,borderRadius:"24px 24px 0 0",width:"100%",maxWidth:430,maxHeight:"90vh",overflow:"auto",padding:20 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <h3 style={{ margin:0,fontWeight:800 }}>{isEdit?"পণ্য সম্পাদনা":"নতুন পণ্য যোগ"}</h3>
          <button onClick={onClose} style={{ background:`${T.danger}15`,border:"none",borderRadius:8,padding:8,cursor:"pointer",color:T.danger }}><SvgIcon icon="x" size={16}/></button>
        </div>
        {error && <div style={{ background:"#FEE2E2",borderRadius:T.radiusSm,padding:"8px 12px",marginBottom:12,fontSize:13,color:T.danger }}>{error}</div>}
        <Input label="পণ্যের নাম *" value={form.name} onChange={v => set("name",v)} placeholder="পণ্যের নাম লিখুন"/>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <Input label="ব্র্যান্ড" value={form.brand} onChange={v => set("brand",v)} placeholder="ব্র্যান্ড"/>
          <Select label="ক্যাটাগরি" value={form.categoryId} onChange={v => set("categoryId",v)} options={[{value:"",label:"ক্যাটাগরি নির্বাচন"}, ...categories.map(c => ({value:c.id, label:c.name}))]} placeholder="ক্যাটাগরি নির্বাচন"/>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <Input label="বিক্রয় মূল্য ৳ *" type="number" value={form.sellPrice} onChange={v => set("sellPrice",v)} placeholder="0" inputMode="numeric"/>
          <Input label="ক্রয় মূল্য ৳" type="number" value={form.buyPrice} onChange={v => set("buyPrice",v)} placeholder="0" inputMode="numeric"/>
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          <Input label="স্টক পরিমাণ" type="number" value={form.stock} onChange={v => set("stock",v)} placeholder="0" inputMode="numeric"/>
          <Select label="একক" value={form.unit} onChange={v => set("unit",v)} options={units}/>
        </div>
        <Input label="লো স্টক সীমা" type="number" value={form.lowStockAlert} onChange={v => set("lowStockAlert",v)} placeholder="5" inputMode="numeric" helper="এর নিচে গেলে সতর্কতা দেখাবে"/>
        <div style={{ display:"flex",gap:8,alignItems:"flex-end" }}>
          <div style={{ flex:1 }}>
            <Input label="বারকোড" value={form.barcode} onChange={v => set("barcode",v)} placeholder="স্বয়ংক্রিয় বা লিখুন"/>
          </div>
          <Btn variant="ghost" size="sm" onClick={genBarcode} style={{ marginBottom:14,whiteSpace:"nowrap" }}>অটো জেনারেট</Btn>
        </div>
        <div style={{ display:"flex",gap:10,marginTop:4 }}>
          <Btn variant="secondary" full onClick={onClose}>বাতিল</Btn>
          <Btn variant="primary" full onClick={save} disabled={saving}>{saving?"সংরক্ষণ হচ্ছে...":"✅ সংরক্ষণ করুন"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Main Inventory ───────────────────────────────────────────
export default function InventoryPage({ user }) {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [selCat,     setSelCat]     = useState("সব");
  const [showAdd,    setShowAdd]    = useState(false);
  const [editProd,   setEditProd]   = useState(null);
  const [qrProd,     setQrProd]     = useState(null);
  const shopId = user?.shopId;

  const load = useCallback(() => {
    if (!shopId) return;
    Promise.all([
      fetch(`/api/products?shopId=${shopId}`).then(r => r.json()),
      fetch(`/api/categories?shopId=${shopId}`).then(r => r.json()),
    ]).then(([p, c]) => {
      if (p.success) setProducts(p.data || []);
      if (c.success) setCategories(c.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [shopId]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = useCallback((prod) => {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === prod.id);
      if (idx >= 0) { const a = [...prev]; a[idx] = prod; return a; }
      return [prod, ...prev];
    });
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("পণ্যটি মুছবেন?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Get category name from id
  const catName = (id) => categories.find(c => c.id === id)?.name || null;

  const filtered = products.filter(p =>
    (selCat === "সব" || p.categories?.name === selCat) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || "").includes(search))
  );
  const catList = ["সব", ...categories.map(c => c.name)];

  if (loading) return <div style={{ padding:40,textAlign:"center" }}><Spinner/></div>;

  return (
    <div>
      {qrProd && <QRModal product={qrProd} onClose={() => setQrProd(null)}/>}
      {(showAdd || editProd) && (
        <ProductModal
          product={editProd}
          categories={categories}
          shopId={shopId}
          onClose={() => { setShowAdd(false); setEditProd(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Search bar */}
      <div style={{ padding:"12px 16px",background:T.surface,borderBottom:`1px solid ${T.border}`,display:"flex",gap:10,alignItems:"center" }}>
        <div style={{ flex:1,position:"relative" }}>
          <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:T.textMuted }}><SvgIcon icon="scan" size={18}/></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="পণ্য বা বারকোড খুঁজুন..." style={{ width:"100%",padding:"10px 12px 10px 40px",border:`1.5px solid ${T.border}`,borderRadius:T.radiusSm,fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box" }}/>
        </div>
        <Btn variant="primary" size="sm" onClick={() => setShowAdd(true)}>
          <SvgIcon icon="plus" size={16} color="#fff"/> যোগ
        </Btn>
      </div>

      {/* Category pills */}
      <div style={{ display:"flex",gap:8,padding:"8px 16px",overflowX:"auto",background:T.surface,borderBottom:`1px solid ${T.border}` }}>
        {catList.map(c => (
          <button key={c} onClick={() => setSelCat(c)} style={{ padding:"5px 14px",borderRadius:20,border:`1.5px solid ${selCat===c?T.brand:T.border}`,background:selCat===c?`${T.brand}10`:"transparent",color:selCat===c?T.brand:T.textSub,fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0 }}>{c}</button>
        ))}
      </div>

      {/* Product list */}
      <div style={{ padding:"12px 16px",paddingBottom:20 }}>
        {/* Stats row */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12 }}>
          {[
            { label:"মোট পণ্য", value: products.length, color:T.info },
            { label:"লো স্টক",  value: products.filter(p => +p.stock <= +p.low_stock_alert).length, color:T.warning },
            { label:"শূন্য স্টক", value: products.filter(p => +p.stock === 0).length, color:T.danger },
          ].map((s,i) => (
            <div key={i} style={{ background:T.surface,borderRadius:T.radiusSm,padding:"10px",textAlign:"center",border:`1px solid ${T.border}` }}>
              <div style={{ fontWeight:800,fontSize:18,color:s.color }}>{s.value}</div>
              <div style={{ fontSize:10,color:T.textMuted }}>{s.label}</div>
            </div>
          ))}
        </div>

        {!filtered.length
          ? <EmptyState icon="📦" title="কোনো পণ্য নেই" sub="নতুন পণ্য যোগ করতে উপরের + বাটন চাপুন"/>
          : filtered.map(p => {
            const pct = Math.min(100, Math.round(+p.stock / Math.max(+p.low_stock_alert * 2, 1) * 100));
            const isLow = +p.stock <= +p.low_stock_alert;
            return (
              <Card key={p.id} style={{ marginBottom:10,padding:14 }}>
                <div style={{ display:"flex",gap:12,alignItems:"flex-start" }}>
                  <Avatar name={p.name} size={46}/>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4 }}>
                      <div style={{ fontWeight:800,fontSize:14,flex:1,paddingRight:8,lineHeight:1.3 }}>{p.name}</div>
                      <div style={{ fontSize:16,fontWeight:800,color:T.brand,flexShrink:0 }}>{taka(p.sell_price)}</div>
                    </div>
                    <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:6 }}>
                      {p.categories?.name && <Badge color="dark">{p.categories.name}</Badge>}
                      {p.brand && <Badge color="info">{p.brand}</Badge>}
                      <Badge color={isLow?"danger":"success"}>{p.stock} {p.unit}</Badge>
                      {isLow && <Badge color="warning">⚠️ লো স্টক</Badge>}
                      {+p.stock === 0 && <Badge color="danger">শূন্য</Badge>}
                    </div>
                    {p.barcode && <div style={{ fontSize:11,color:T.textMuted,marginBottom:6 }}>বারকোড: {p.barcode}</div>}
                    <div style={{ marginBottom:8 }}>
                      <ProgressBar value={pct} max={100} color={isLow?T.danger:T.success}/>
                    </div>
                    <div style={{ display:"flex",gap:6 }}>
                      <Btn variant="ghost" size="sm" onClick={() => setQrProd(p)}><SvgIcon icon="qr" size={14}/> QR</Btn>
                      <Btn variant="secondary" size="sm" onClick={() => setEditProd(p)}><SvgIcon icon="edit" size={14}/> সম্পাদনা</Btn>
                      <Btn variant="danger" size="sm" onClick={() => handleDelete(p.id)}><SvgIcon icon="trash" size={14}/></Btn>
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
