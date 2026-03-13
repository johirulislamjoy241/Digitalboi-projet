"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { T } from "@/lib/design";
import { Card, Btn, Avatar, Badge, Spinner } from "@/lib/ui";
import { SvgIcon } from "@/lib/icons";
import { taka } from "@/lib/helpers";

// ── Receipt Modal ──────────────────────────────────────────────
function ReceiptModal({ sale, shopName, onClose }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
      <div style={{ background:"#fff",borderRadius:T.radiusLg,width:"100%",maxWidth:360,maxHeight:"90vh",overflow:"auto" }}>
        <div style={{ padding:"20px 20px 0",textAlign:"center",borderBottom:`2px dashed ${T.border}` }}>
          <div style={{ fontWeight:800,fontSize:18,color:T.text }}>{shopName}</div>
          <div style={{ fontSize:12,color:T.textMuted,marginBottom:4 }}>বিক্রয় রসিদ</div>
          <div style={{ fontSize:11,color:T.textMuted,marginBottom:16 }}>ইনভয়েস: {sale?.invoice_id}</div>
        </div>
        <div style={{ padding:"14px 20px" }}>
          {sale?.items?.map((item,i) => (
            <div key={i} style={{ display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:13 }}>
              <div>{item.name} × {item.quantity}</div>
              <div style={{ fontWeight:600 }}>{taka(item.unitPrice * item.quantity)}</div>
            </div>
          ))}
          <div style={{ borderTop:`2px dashed ${T.border}`,paddingTop:10,marginTop:10 }}>
            {sale?.discount > 0 && (
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,color:T.textMuted,marginBottom:4 }}>
                <span>সাবটোটাল</span><span>{taka(sale.subtotal)}</span>
              </div>
            )}
            {sale?.discount > 0 && (
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,color:T.danger,marginBottom:4 }}>
                <span>ছাড় ({sale.discountPct}%)</span><span>-{taka(sale.discount)}</span>
              </div>
            )}
            <div style={{ display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:16,color:T.brand,marginBottom:4 }}>
              <span>মোট</span><span>{taka(sale.total)}</span>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:2 }}>
              <span>পেমেন্ট</span><span style={{ fontWeight:600 }}>{sale.paymentMethod}</span>
            </div>
            {sale?.due > 0 && (
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,color:T.warning,fontWeight:700 }}>
                <span>বাকি</span><span>{taka(sale.due)}</span>
              </div>
            )}
          </div>
          <div style={{ textAlign:"center",marginTop:14,fontSize:11,color:T.textMuted }}>ধন্যবাদ! আবার আসবেন 🙏</div>
        </div>
        <div style={{ padding:"0 16px 16px",display:"flex",gap:10 }}>
          <Btn variant="secondary" full onClick={onClose}>বন্ধ</Btn>
          <Btn variant="primary" full onClick={() => window.print()}>🖨️ প্রিন্ট</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Main POS ──────────────────────────────────────────────────
export default function POSPage({ user }) {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers,  setCustomers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [cart,       setCart]       = useState([]);
  const [search,     setSearch]     = useState("");
  const [selCat,     setSelCat]     = useState("সব");
  const [discount,   setDiscount]   = useState(0);
  const [method,     setMethod]     = useState("নগদ");
  const [custId,     setCustId]     = useState("");
  const [receipt,    setReceipt]    = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const shopId = user?.shopId;
  const searchRef = useRef(null);

  const load = useCallback(() => {
    if (!shopId) return;
    Promise.all([
      fetch(`/api/products?shopId=${shopId}`).then(r => r.json()),
      fetch(`/api/categories?shopId=${shopId}`).then(r => r.json()),
      fetch(`/api/customers?shopId=${shopId}`).then(r => r.json()),
    ]).then(([p, c, cu]) => {
      if (p.success)  setProducts(p.data || []);
      if (c.success)  setCategories(c.data || []);
      if (cu.success) setCustomers(cu.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [shopId]);

  useEffect(() => { load(); }, [load]);

  // Cart helpers
  const addToCart = useCallback((product) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.productId === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { productId: product.id, name: product.name, unitPrice: +product.sell_price, quantity: 1, stock: +product.stock }];
    });
    setSearch("");
  }, []);

  const updateQty = useCallback((idx, delta) => {
    setCart(prev => {
      const next = [...prev];
      const newQty = next[idx].quantity + delta;
      if (newQty <= 0) return next.filter((_, i) => i !== idx);
      next[idx] = { ...next[idx], quantity: newQty };
      return next;
    });
  }, []);

  const removeItem = useCallback((idx) => setCart(prev => prev.filter((_, i) => i !== idx)), []);

  // Barcode search
  const handleSearch = (val) => {
    setSearch(val);
    if (val.length >= 8) {
      const found = products.find(p => p.barcode === val);
      if (found) { addToCart(found); return; }
    }
  };

  // Totals
  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discAmt  = Math.floor(subtotal * (discount / 100));
  const total    = subtotal - discAmt;
  const due      = method === "বাকি" ? total : 0;

  // Filtered products
  const filtered = products.filter(p =>
    (selCat === "সব" || p.categories?.name === selCat) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || "").includes(search))
  );

  const checkout = async () => {
    if (!cart.length) return setError("কার্টে পণ্য যোগ করুন");
    if (method === "বাকি" && !custId) return setError("বাকির জন্য কাস্টমার নির্বাচন করুন");
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, customerId: custId || null, items: cart, paymentMethod: method, discountPct: discount }),
      });
      const d = await res.json();
      if (!d.success) { setError(d.error || "বিক্রয় ব্যর্থ"); setSaving(false); return; }

      setReceipt({ invoice_id: d.data.invoiceId || d.data.invoice_id, items: cart, subtotal, discount: discAmt, discountPct: discount, total, paymentMethod: method, due });
      setCart([]); setDiscount(0); setMethod("নগদ"); setCustId("");
      // Refresh stock
      load();
    } catch { setError("সার্ভার সমস্যা"); }
    setSaving(false);
  };

  const METHODS = ["নগদ","বিকাশ","নগদ MFS","কার্ড","রকেট","বাকি"];
  const catList  = ["সব", ...categories.map(c => c.name)];

  if (loading) return <div style={{ padding:40,textAlign:"center" }}><Spinner/></div>;

  return (
    <div style={{ display:"flex",flexDirection:"column",height:"100dvh",background:T.bg,paddingBottom:80 }}>
      {receipt && <ReceiptModal sale={receipt} shopName={user?.shopName} onClose={() => setReceipt(null)}/>}

      {/* Top bar */}
      <div style={{ background:T.surface,padding:"12px 16px",borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:50 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
          <div style={{ fontWeight:800,fontSize:16,flex:1 }}>🛒 POS বিক্রয়</div>
          {cart.length > 0 && <Badge color="brand">{cart.reduce((s,i)=>s+i.quantity,0)} আইটেম</Badge>}
        </div>
        {/* Search / Barcode */}
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:T.textMuted }}><SvgIcon icon="scan" size={18}/></span>
          <input ref={searchRef} value={search} onChange={e => handleSearch(e.target.value)} placeholder="পণ্য খুঁজুন বা বারকোড স্ক্যান করুন..." style={{ width:"100%",padding:"10px 12px 10px 40px",border:`1.5px solid ${T.border}`,borderRadius:T.radiusSm,fontSize:14,outline:"none",fontFamily:"inherit",boxSizing:"border-box" }}/>
        </div>
      </div>

      {/* Category pills */}
      <div style={{ display:"flex",gap:8,padding:"8px 16px",overflowX:"auto",background:T.surface,borderBottom:`1px solid ${T.border}` }}>
        {catList.map(c => (
          <button key={c} onClick={() => setSelCat(c)} style={{ padding:"5px 14px",borderRadius:20,border:`1.5px solid ${selCat===c?T.brand:T.border}`,background:selCat===c?`${T.brand}10`:"transparent",color:selCat===c?T.brand:T.textSub,fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0 }}>{c}</button>
        ))}
      </div>

      {/* Product grid */}
      <div style={{ flex:1,overflow:"auto",padding:"10px 16px" }}>
        {!filtered.length
          ? <div style={{ textAlign:"center",padding:40,color:T.textMuted }}>পণ্য পাওয়া যায়নি</div>
          : <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
            {filtered.map(p => {
              const inCart = cart.find(i => i.productId === p.id);
              const noStock = +p.stock <= 0;
              return (
                <button key={p.id} onClick={() => !noStock && addToCart(p)} disabled={noStock} style={{ background:T.surface,borderRadius:T.radius,border:`1.5px solid ${inCart?T.brand:T.border}`,padding:12,cursor:noStock?"not-allowed":"pointer",textAlign:"left",fontFamily:"inherit",opacity:noStock?0.5:1,position:"relative" }}>
                  {inCart && <span style={{ position:"absolute",top:8,right:8,background:T.brand,color:"#fff",borderRadius:20,padding:"2px 7px",fontSize:10,fontWeight:700 }}>×{inCart.quantity}</span>}
                  <div style={{ fontWeight:700,fontSize:13,color:T.text,marginBottom:4,lineHeight:1.3,paddingRight:inCart?30:0 }}>{p.name}</div>
                  {p.brand && <div style={{ fontSize:11,color:T.textMuted,marginBottom:4 }}>{p.brand}</div>}
                  <div style={{ fontWeight:800,color:T.brand,fontSize:15 }}>{taka(p.sell_price)}</div>
                  <div style={{ fontSize:10,color:noStock?T.danger:T.textMuted,marginTop:2 }}>স্টক: {p.stock} {p.unit}</div>
                </button>
              );
            })}
          </div>
        }
      </div>

      {/* Cart & checkout */}
      {cart.length > 0 && (
        <div style={{ background:T.surface,borderTop:`2px solid ${T.border}`,padding:"12px 16px",maxHeight:"55vh",overflow:"auto" }}>
          {/* Cart items */}
          {cart.map((item, idx) => (
            <div key={idx} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${T.border}` }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700,fontSize:13 }}>{item.name}</div>
                <div style={{ fontSize:12,color:T.brand }}>{taka(item.unitPrice)} × {item.quantity} = {taka(item.unitPrice*item.quantity)}</div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                <button onClick={() => updateQty(idx,-1)} style={{ width:28,height:28,borderRadius:8,border:`1px solid ${T.border}`,background:T.bg,cursor:"pointer",fontWeight:800,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center" }}>−</button>
                <span style={{ fontWeight:700,minWidth:20,textAlign:"center" }}>{item.quantity}</span>
                <button onClick={() => updateQty(idx,+1)} style={{ width:28,height:28,borderRadius:8,border:`1px solid ${T.brand}`,background:`${T.brand}10`,cursor:"pointer",fontWeight:800,fontSize:16,color:T.brand,display:"flex",alignItems:"center",justifyContent:"center" }}>+</button>
                <button onClick={() => removeItem(idx)} style={{ width:28,height:28,borderRadius:8,border:`1px solid ${T.danger}30`,background:`${T.danger}10`,cursor:"pointer",color:T.danger,display:"flex",alignItems:"center",justifyContent:"center" }}><SvgIcon icon="x" size={14}/></button>
              </div>
            </div>
          ))}

          {/* Discount */}
          <div style={{ display:"flex",alignItems:"center",gap:10,margin:"12px 0 8px" }}>
            <label style={{ fontSize:13,fontWeight:700,color:T.textSub,whiteSpace:"nowrap" }}>ছাড় %</label>
            <input type="number" value={discount} onChange={e => setDiscount(Math.min(100, Math.max(0, +e.target.value)))} min="0" max="100" style={{ width:70,padding:"7px 10px",border:`1.5px solid ${T.border}`,borderRadius:T.radiusSm,fontSize:14,fontFamily:"inherit",outline:"none",textAlign:"center" }}/>
            <div style={{ flex:1,textAlign:"right",fontSize:13,color:T.textMuted }}>
              {discount>0 && <span style={{ color:T.danger }}>-{taka(discAmt)} ছাড়</span>}
            </div>
          </div>

          {/* Customer select */}
          <select value={custId} onChange={e => setCustId(e.target.value)} style={{ width:"100%",padding:"9px 12px",border:`1.5px solid ${T.border}`,borderRadius:T.radiusSm,fontSize:13,fontFamily:"inherit",marginBottom:10,background:T.surface,outline:"none" }}>
            <option value="">সাধারণ কাস্টমার</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone?` (${c.phone})`:""}</option>)}
          </select>

          {/* Payment methods */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12 }}>
            {METHODS.map(m => (
              <button key={m} onClick={() => setMethod(m)} style={{ padding:"9px 4px",borderRadius:8,border:`1.5px solid ${method===m?T.brand:T.border}`,background:method===m?`${T.brand}10`:"transparent",fontWeight:700,fontSize:12,color:method===m?T.brand:T.textSub,cursor:"pointer",fontFamily:"inherit" }}>{m}</button>
            ))}
          </div>

          {/* Summary */}
          <div style={{ background:`${T.brand}08`,borderRadius:T.radiusSm,padding:"10px 12px",marginBottom:10 }}>
            <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4 }}>
              <span>সাবটোটাল</span><span>{taka(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:13,color:T.danger,marginBottom:4 }}>
                <span>ছাড় ({discount}%)</span><span>-{taka(discAmt)}</span>
              </div>
            )}
            <div style={{ display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:17,color:T.brand }}>
              <span>মোট</span><span>{taka(total)}</span>
            </div>
            {method === "বাকি" && <div style={{ fontSize:12,color:T.warning,marginTop:4,fontWeight:700 }}>⚠️ সম্পূর্ণ বাকি থাকবে</div>}
          </div>

          {error && <div style={{ background:"#FEE2E2",borderRadius:T.radiusSm,padding:"8px 12px",marginBottom:8,fontSize:13,color:T.danger }}>{error}</div>}

          <Btn variant="primary" full onClick={checkout} disabled={saving} style={{ fontSize:15,padding:14 }}>
            {saving ? "প্রক্রিয়া হচ্ছে..." : `✅ চেকআউট — ${taka(total)}`}
          </Btn>
        </div>
      )}
    </div>
  );
}
