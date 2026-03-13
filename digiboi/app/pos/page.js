'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useCartStore, useToastStore } from '@/lib/store';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';

export default function POSPage() {
  const router = useRouter();
  const { shop } = useAuthStore();
  const cart = useCartStore();
  const { addToast } = useToastStore();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selCat, setSelCat] = useState('');
  const [customers, setCustomers] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [productLoading, setProductLoading] = useState(true);
  const searchRef = useRef();

  useEffect(() => { loadInitial(); }, []);
  useEffect(() => { loadProducts(); }, [search, selCat]);

  const loadInitial = async () => {
    try {
      const [cats, custs] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/customers'),
      ]);
      setCategories(cats);
      setCustomers(custs);
    } catch(e) { addToast(e.message,'error'); }
  };

  const loadProducts = async () => {
    setProductLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selCat) params.set('category', selCat);
      const data = await api.get('/api/products?' + params.toString());
      setProducts(data);
    } catch(e) { addToast(e.message,'error'); }
    finally { setProductLoading(false); }
  };

  const addToCart = (product) => {
    if (product.stock_quantity <= 0) { addToast('স্টক নেই!','error'); return; }
    cart.addItem(product);
    addToast(`${product.name} কার্টে যোগ হয়েছে`);
  };

  const completeSale = async () => {
    if (cart.items.length === 0) { addToast('পণ্য যোগ করুন','error'); return; }
    setLoading(true);
    try {
      const total = cart.getTotal();
      // BUG FIX: 'বাকি' মানে paid=0
      const paid = cart.paymentMethod === 'due' ? 0 : (paidAmount !== '' ? Number(paidAmount) : total);
      const data = await api.post('/api/sales', {
        items: cart.items.map(i => ({ ...i, qty: i.qty })),
        customerId: cart.customerId,
        discount: cart.discount,
        paidAmount: paid,
        paymentMethod: cart.paymentMethod,
        notes: cart.notes,
      });
      cart.clearCart();
      setPaidAmount('');
      setShowCheckout(false);
      addToast('বিক্রয় সম্পন্ন!');
      router.push(`/receipt/${data.id}`);
    } catch(e) { addToast(e.message,'error'); }
    finally { setLoading(false); }
  };

  const subtotal = cart.getSubtotal();
  const total = cart.getTotal();
  const paid = paidAmount !== '' ? Number(paidAmount) : total;
  const change = Math.max(0, paid - total);
  const due = Math.max(0, total - paid);
  const fmt = n => `৳${Number(n||0).toLocaleString('bn-BD')}`;

  return (
    <AppShell title="বিক্রয় (POS)">
      <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 120px)' }}>

        {/* Search */}
        <div style={{ padding:'12px 16px', background:'white', borderBottom:'1px solid #F0F4F8' }}>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'16px' }}>🔍</span>
            <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="পণ্য search করুন বা barcode scan করুন..."
              style={{ width:'100%', padding:'12px 12px 12px 40px', border:'2px solid #E8EDF5', borderRadius:'12px', fontSize:'14px', outline:'none', boxSizing:'border-box', fontFamily:"'Hind Siliguri',sans-serif" }} />
          </div>
          {/* Categories */}
          <div style={{ display:'flex', gap:'8px', overflowX:'auto', marginTop:'10px', paddingBottom:'4px' }}>
            <button onClick={()=>setSelCat('')} style={{ flexShrink:0, padding:'6px 14px', borderRadius:'20px', border:'none', background:!selCat?'#0F4C81':'#F0F4F8', color:!selCat?'white':'#5E6E8A', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:"'Hind Siliguri',sans-serif" }}>সব</button>
            {categories.map(c=>(
              <button key={c.id} onClick={()=>setSelCat(c.id)} style={{ flexShrink:0, padding:'6px 14px', borderRadius:'20px', border:'none', background:selCat===c.id?c.color||'#0F4C81':'#F0F4F8', color:selCat===c.id?'white':'#5E6E8A', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:"'Hind Siliguri',sans-serif" }}>{c.icon} {c.name}</button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>
          {productLoading ? (
            <div style={{ textAlign:'center', padding:'40px', color:'#8A9AB5' }}>⏳ লোড হচ্ছে...</div>
          ) : products.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px', color:'#8A9AB5' }}>পণ্য পাওয়া যায়নি</div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
              {products.map(p => {
                const inCart = cart.items.find(i=>i.id===p.id);
                return (
                  <div key={p.id} onClick={()=>addToCart(p)} style={{ background:'white', borderRadius:'14px', padding:'12px', boxShadow:'0 2px 8px rgba(15,40,80,0.06)', cursor:'pointer', border:inCart?'2px solid #0F4C81':'2px solid transparent', position:'relative', transition:'all 0.15s' }}>
                    {inCart && <span style={{ position:'absolute', top:'8px', right:'8px', background:'#0F4C81', color:'white', borderRadius:'10px', fontSize:'11px', fontWeight:'700', padding:'2px 7px' }}>{inCart.qty}</span>}
                    <p style={{ margin:0, fontSize:'13px', fontWeight:'700', color:'#141D28', lineHeight:1.3 }}>{p.name}</p>
                    <p style={{ margin:'4px 0', fontSize:'15px', fontWeight:'800', color:'#0F4C81' }}>{fmt(p.selling_price)}</p>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:'11px', color:'#8A9AB5' }}>স্টক: {p.stock_quantity} {p.unit}</span>
                      {p.stock_quantity <= p.min_stock_alert && p.stock_quantity > 0 && <span style={{ fontSize:'10px', background:'#FEF3C7', color:'#92400E', borderRadius:'6px', padding:'2px 6px', fontWeight:'600' }}>কম</span>}
                      {p.stock_quantity <= 0 && <span style={{ fontSize:'10px', background:'#FEE2E2', color:'#991B1B', borderRadius:'6px', padding:'2px 6px', fontWeight:'600' }}>শেষ</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Button */}
        {cart.items.length > 0 && !showCart && (
          <div style={{ padding:'12px 16px', background:'white', borderTop:'1px solid #F0F4F8' }}>
            <button onClick={()=>setShowCart(true)} style={{ width:'100%', padding:'15px', background:'linear-gradient(135deg,#0F4C81,#2E86DE)', color:'white', border:'none', borderRadius:'14px', fontSize:'15px', fontWeight:'700', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:"'Hind Siliguri',sans-serif" }}>
              <span>🛒 কার্ট দেখুন ({cart.items.reduce((s,i)=>s+i.qty,0)} পণ্য)</span>
              <span>{fmt(total)}</span>
            </button>
          </div>
        )}

        {/* Cart Drawer */}
        {showCart && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'flex-end' }} onClick={()=>!showCheckout&&setShowCart(false)}>
            <div onClick={e=>e.stopPropagation()} style={{ background:'white', borderRadius:'24px 24px 0 0', width:'100%', maxHeight:'90vh', overflowY:'auto', padding:'20px' }}>
              <div style={{ textAlign:'center', marginBottom:'16px' }}>
                <div style={{ width:'40px', height:'4px', background:'#DDE4EE', borderRadius:'4px', margin:'0 auto 12px' }} />
                <p style={{ margin:0, fontWeight:'800', fontSize:'16px', color:'#141D28' }}>কার্ট</p>
              </div>

              {/* Cart Items */}
              {cart.items.map(item => (
                <div key={item.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 0', borderBottom:'1px solid #F0F4F8' }}>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:0, fontSize:'13px', fontWeight:'600', color:'#141D28' }}>{item.name}</p>
                    <p style={{ margin:'2px 0 0', fontSize:'12px', color:'#8A9AB5' }}>{fmt(item.selling_price)} × {item.qty}</p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <button onClick={()=>cart.updateQty(item.id,item.qty-1)} style={{ width:'28px', height:'28px', border:'1px solid #DDE4EE', borderRadius:'8px', background:'white', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                    <span style={{ fontWeight:'700', minWidth:'24px', textAlign:'center', fontSize:'14px' }}>{item.qty}</span>
                    <button onClick={()=>cart.updateQty(item.id,item.qty+1)} style={{ width:'28px', height:'28px', border:'none', borderRadius:'8px', background:'#0F4C81', color:'white', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                    <button onClick={()=>cart.removeItem(item.id)} style={{ width:'28px', height:'28px', border:'none', borderRadius:'8px', background:'#FEE2E2', color:'#E63946', cursor:'pointer', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center' }}>🗑</button>
                  </div>
                  <span style={{ fontWeight:'700', minWidth:'70px', textAlign:'right', fontSize:'14px' }}>{fmt(item.selling_price*item.qty)}</span>
                </div>
              ))}

              {/* Customer */}
              <div style={{ marginTop:'14px' }}>
                <label style={{ fontSize:'12px', fontWeight:'600', color:'#5E6E8A', display:'block', marginBottom:'6px' }}>গ্রাহক (ঐচ্ছিক)</label>
                <select value={cart.customerId||''} onChange={e=>{const c=customers.find(x=>x.id===e.target.value);cart.setCustomer(e.target.value,c?.name||'')}} style={{ width:'100%', padding:'10px', border:'2px solid #E8EDF5', borderRadius:'10px', fontSize:'13px', outline:'none', fontFamily:"'Hind Siliguri',sans-serif" }}>
                  <option value="">সাধারণ গ্রাহক</option>
                  {customers.map(c=><option key={c.id} value={c.id}>{c.name} {c.due_amount>0?`(বাকি: ৳${c.due_amount})`:''}</option>)}
                </select>
              </div>

              {/* Discount */}
              <div style={{ marginTop:'10px' }}>
                <label style={{ fontSize:'12px', fontWeight:'600', color:'#5E6E8A', display:'block', marginBottom:'6px' }}>ছাড় (৳)</label>
                <input type="number" value={cart.discount||''} onChange={e=>cart.setDiscount(e.target.value)} placeholder="0" style={{ width:'100%', padding:'10px', border:'2px solid #E8EDF5', borderRadius:'10px', fontSize:'13px', outline:'none', boxSizing:'border-box', fontFamily:"'Hind Siliguri',sans-serif" }} />
              </div>

              {/* Summary */}
              <div style={{ background:'#F8FAFC', borderRadius:'12px', padding:'14px', marginTop:'14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                  <span style={{ color:'#5E6E8A', fontSize:'13px' }}>উপমোট</span>
                  <span style={{ fontWeight:'600', fontSize:'13px' }}>{fmt(subtotal)}</span>
                </div>
                {cart.discount > 0 && <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                  <span style={{ color:'#0BAA69', fontSize:'13px' }}>ছাড়</span>
                  <span style={{ fontWeight:'600', fontSize:'13px', color:'#0BAA69' }}>-{fmt(cart.discount)}</span>
                </div>}
                <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid #DDE4EE', paddingTop:'8px', marginTop:'4px' }}>
                  <span style={{ fontWeight:'800', color:'#141D28' }}>সর্বমোট</span>
                  <span style={{ fontWeight:'800', fontSize:'18px', color:'#0F4C81' }}>{fmt(total)}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div style={{ marginTop:'14px' }}>
                <label style={{ fontSize:'12px', fontWeight:'600', color:'#5E6E8A', display:'block', marginBottom:'8px' }}>পেমেন্ট মাধ্যম</label>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  {[['cash','💵 নগদ'],['bkash','💗 bKash'],['nagad','💛 নগদ App'],['card','💳 কার্ড'],['due','⏳ বাকি']].map(([k,l])=>(
                    <button key={k} onClick={()=>cart.setPaymentMethod(k)} style={{ padding:'8px 14px', border:`2px solid ${cart.paymentMethod===k?'#0F4C81':'#DDE4EE'}`, borderRadius:'10px', background:cart.paymentMethod===k?'#EBF2FF':'white', color:cart.paymentMethod===k?'#0F4C81':'#5E6E8A', fontWeight:'600', fontSize:'12px', cursor:'pointer', fontFamily:"'Hind Siliguri',sans-serif" }}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Paid Amount */}
              {cart.paymentMethod !== 'due' && (
                <div style={{ marginTop:'10px' }}>
                  <label style={{ fontSize:'12px', fontWeight:'600', color:'#5E6E8A', display:'block', marginBottom:'6px' }}>গ্রাহকের দেওয়া টাকা (৳)</label>
                  <input type="number" value={paidAmount} onChange={e=>setPaidAmount(e.target.value)} placeholder={total.toString()} style={{ width:'100%', padding:'12px', border:'2px solid #E8EDF5', borderRadius:'10px', fontSize:'14px', outline:'none', boxSizing:'border-box', fontFamily:"'Hind Siliguri',sans-serif" }} />
                  {paidAmount && paid > total && <p style={{ margin:'4px 0 0', color:'#0BAA69', fontSize:'13px', fontWeight:'600' }}>ফেরত: {fmt(change)}</p>}
                  {paidAmount && paid < total && <p style={{ margin:'4px 0 0', color:'#E63946', fontSize:'13px', fontWeight:'600' }}>বাকি: {fmt(due)}</p>}
                </div>
              )}

              <div style={{ display:'flex', gap:'10px', marginTop:'16px' }}>
                <button onClick={()=>{cart.clearCart();setShowCart(false)}} style={{ flex:1, padding:'14px', border:'2px solid #E63946', borderRadius:'14px', background:'white', color:'#E63946', fontWeight:'700', cursor:'pointer', fontFamily:"'Hind Siliguri',sans-serif" }}>🗑 কার্ট খালি</button>
                <button onClick={completeSale} disabled={loading} style={{ flex:2, padding:'14px', background:'linear-gradient(135deg,#0BAA69,#059669)', color:'white', border:'none', borderRadius:'14px', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:"'Hind Siliguri',sans-serif" }}>
                  {loading ? '⏳ প্রক্রিয়া...' : '✅ বিক্রয় সম্পন্ন'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
