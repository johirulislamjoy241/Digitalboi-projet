'use client';
import { useState, useEffect, useRef } from 'react';
import { useToastStore } from '@/lib/store';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';

const INP = { width:'100%', padding:'11px 12px', border:'2px solid #E8EDF5', borderRadius:'10px', fontSize:'14px', outline:'none', boxSizing:'border-box', fontFamily:"'Hind Siliguri',sans-serif", background:'white' };
const LBL = { fontSize:'12px', fontWeight:'600', color:'#5E6E8A', display:'block', marginBottom:'5px' };
const EMPTY_SUPPLIER = { name:'', phone:'', address:'' };
const EMPTY_PURCHASE = { items:[{productId:'',productName:'',quantity:1,unitPrice:''}], paidAmount:'', paymentMethod:'cash', notes:'' };

// ── AddSupplierModal — outside parent ─────────────────────────────────────
function AddSupplierModal({ visible, saving, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY_SUPPLIER);
  const nameRef = useRef();

  useEffect(() => {
    if (visible) { setForm(EMPTY_SUPPLIER); setTimeout(() => nameRef.current?.focus(), 100); }
  }, [visible]);

  if (!visible) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'24px 24px 0 0', width:'100%', padding:'20px 20px 32px' }}>
        <div style={{ width:'40px', height:'4px', background:'#DDE4EE', borderRadius:'4px', margin:'0 auto 14px' }} />
        <p style={{ margin:'0 0 16px', fontWeight:'800', fontSize:'16px', textAlign:'center', color:'#141D28' }}>নতুন সরবরাহকারী</p>
        {[['নাম *','name','text'],['ফোন','phone','tel'],['ঠিকানা','address','text']].map(([l,k,t], i) => (
          <div key={k} style={{ marginBottom:'12px' }}>
            <label style={LBL}>{l}</label>
            <input ref={i===0?nameRef:undefined} type={t} value={form[k]} onChange={e => set(k, e.target.value)} style={INP} autoComplete="off" />
          </div>
        ))}
        <div style={{ display:'flex', gap:'10px', marginTop:'8px' }}>
          <button onClick={onClose} style={{ flex:1, padding:'13px', border:'2px solid #DDE4EE', borderRadius:'12px', background:'white', fontWeight:'600', cursor:'pointer', color:'#5E6E8A', fontFamily:'inherit' }}>বাতিল</button>
          <button onClick={() => onSave(form)} disabled={saving}
            style={{ flex:2, padding:'13px', background: saving?'#F4BC90':'linear-gradient(135deg,#F4A261,#E76F51)', color:'white', border:'none', borderRadius:'12px', fontWeight:'700', cursor: saving?'default':'pointer', fontFamily:'inherit' }}>
            {saving ? '⏳ সংরক্ষণ...' : '✅ যোগ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PurchaseModal — outside parent ─────────────────────────────────────────
function PurchaseModal({ supplier, products, visible, saving, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY_PURCHASE);

  useEffect(() => {
    if (visible) setForm(EMPTY_PURCHASE);
  }, [visible]);

  if (!visible || !supplier) return null;

  const addItem    = () => setForm(f => ({ ...f, items:[...f.items, {productId:'',productName:'',quantity:1,unitPrice:''}] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_,idx) => idx!==i) }));
  const updateItem = (i, k, v) => setForm(f => ({ ...f, items: f.items.map((it,idx) => idx===i ? {...it,[k]:v} : it) }));

  const total = form.items.reduce((s,i) => s + (Number(i.quantity)||0)*(Number(i.unitPrice)||0), 0);
  const fmt = n => `৳${Number(n||0).toLocaleString('bn-BD')}`;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'flex-end' }}>
      <div style={{ background:'white', borderRadius:'24px 24px 0 0', width:'100%', maxHeight:'92vh', overflowY:'auto', padding:'20px 20px 32px' }}>
        <div style={{ width:'40px', height:'4px', background:'#DDE4EE', borderRadius:'4px', margin:'0 auto 14px' }} />
        <p style={{ margin:'0 0 16px', fontWeight:'800', fontSize:'16px', textAlign:'center', color:'#141D28' }}>ক্রয় এন্ট্রি — {supplier.name}</p>

        {form.items.map((item, i) => (
          <div key={i} style={{ background:'#F8FAFC', borderRadius:'12px', padding:'12px', marginBottom:'10px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
              <span style={{ fontWeight:'700', fontSize:'13px', color:'#141D28' }}>পণ্য {i+1}</span>
              {form.items.length > 1 && (
                <button onClick={() => removeItem(i)} style={{ border:'none', background:'#FEE2E2', color:'#E63946', borderRadius:'6px', padding:'2px 10px', cursor:'pointer', fontSize:'12px', fontFamily:'inherit' }}>মুছুন</button>
              )}
            </div>
            <select value={item.productId} onChange={e => {
              const p = products.find(x => x.id===e.target.value);
              updateItem(i,'productId',e.target.value);
              if (p) { updateItem(i,'productName',p.name); updateItem(i,'unitPrice',String(p.cost_price||'')); }
            }} style={{ ...INP, marginBottom:'8px' }}>
              <option value="">-- বিদ্যমান পণ্য বাছুন --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (স্টক: {p.stock_quantity})</option>)}
            </select>
            {!item.productId && (
              <input value={item.productName} onChange={e => updateItem(i,'productName',e.target.value)}
                placeholder="নতুন পণ্যের নাম লিখুন" style={{ ...INP, marginBottom:'8px' }} autoComplete="off" />
            )}
            <div style={{ display:'flex', gap:'8px' }}>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:'11px', color:'#8A9AB5', fontWeight:'600', display:'block', marginBottom:'4px' }}>পরিমাণ</label>
                <input type="number" inputMode="decimal" value={item.quantity} onChange={e => updateItem(i,'quantity',e.target.value)} style={INP} />
              </div>
              <div style={{ flex:1 }}>
                <label style={{ fontSize:'11px', color:'#8A9AB5', fontWeight:'600', display:'block', marginBottom:'4px' }}>একক মূল্য (৳)</label>
                <input type="number" inputMode="decimal" value={item.unitPrice} onChange={e => updateItem(i,'unitPrice',e.target.value)} style={INP} />
              </div>
            </div>
            {item.quantity && item.unitPrice && (
              <p style={{ margin:'6px 0 0', fontSize:'12px', color:'#0F4C81', fontWeight:'700' }}>মোট: {fmt(Number(item.quantity)*Number(item.unitPrice))}</p>
            )}
          </div>
        ))}

        <button onClick={addItem} style={{ width:'100%', padding:'10px', border:'2px dashed #DDE4EE', borderRadius:'12px', background:'white', color:'#0F4C81', fontWeight:'600', cursor:'pointer', marginBottom:'12px', fontFamily:'inherit' }}>+ আরো পণ্য</button>

        <div style={{ background:'#EBF2FF', borderRadius:'10px', padding:'10px 14px', marginBottom:'12px' }}>
          <span style={{ fontWeight:'700', color:'#0F4C81', fontSize:'14px' }}>মোট: {fmt(total)}</span>
        </div>

        <div style={{ marginBottom:'12px' }}>
          <label style={LBL}>প্রদত্ত টাকা (৳) — খালি থাকলে সম্পূর্ণ পরিশোধ</label>
          <input type="number" inputMode="decimal" value={form.paidAmount} onChange={e => setForm(f => ({...f, paidAmount:e.target.value}))}
            placeholder={String(total)} style={INP} />
        </div>

        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={onClose} style={{ flex:1, padding:'13px', border:'2px solid #DDE4EE', borderRadius:'12px', background:'white', fontWeight:'600', cursor:'pointer', color:'#5E6E8A', fontFamily:'inherit' }}>বাতিল</button>
          <button onClick={() => onSave(form)} disabled={saving}
            style={{ flex:2, padding:'13px', background: saving?'#6BC9A0':'linear-gradient(135deg,#0BAA69,#059669)', color:'white', border:'none', borderRadius:'12px', fontWeight:'700', cursor: saving?'default':'pointer', fontFamily:'inherit' }}>
            {saving ? '⏳ সংরক্ষণ...' : '✅ ক্রয় সংরক্ষণ'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function SuppliersPage() {
  const { addToast } = useToastStore();
  const [suppliers,      setSuppliers]      = useState([]);
  const [products,       setProducts]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showAdd,        setShowAdd]        = useState(false);
  const [showPurchase,   setShowPurchase]   = useState(null);
  const [saving,         setSaving]         = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([api.get('/api/suppliers'), api.get('/api/products')]);
      setSuppliers(s); setProducts(p);
    } catch(e) { addToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleAddSupplier = async (form) => {
    if (!form.name.trim()) { addToast('নাম দিন', 'error'); return; }
    setSaving(true);
    try {
      await api.post('/api/suppliers', form);
      addToast('সরবরাহকারী যোগ হয়েছে ✅');
      setShowAdd(false); loadAll();
    } catch(e) { addToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleSavePurchase = async (form) => {
    const validItems = form.items.filter(i => i.productName && i.unitPrice);
    if (!validItems.length) { addToast('কমপক্ষে ১টি পণ্য দিন', 'error'); return; }
    setSaving(true);
    try {
      const total = validItems.reduce((s,i) => s + Number(i.quantity)*Number(i.unitPrice), 0);
      await api.post('/api/purchases', {
        supplierId: showPurchase.id,
        items: validItems.map(i => ({ ...i, quantity:Number(i.quantity), unitPrice:Number(i.unitPrice) })),
        paidAmount: form.paidAmount !== '' ? Number(form.paidAmount) : total,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
      });
      addToast('ক্রয় এন্ট্রি হয়েছে, স্টক আপডেট হয়েছে ✅');
      setShowPurchase(null); loadAll();
    } catch(e) { addToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const fmt = n => `৳${Number(n||0).toLocaleString('bn-BD')}`;

  return (
    <AppShell title="সরবরাহকারী">
      <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:'12px', paddingBottom:'24px' }}>
        <button onClick={() => setShowAdd(true)}
          style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#F4A261,#E76F51)', color:'white', border:'none', borderRadius:'14px', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}>
          + নতুন সরবরাহকারী যোগ করুন
        </button>

        {loading ? (
          <div style={{ textAlign:'center', padding:'40px', color:'#8A9AB5' }}>⏳ লোড হচ্ছে...</div>
        ) : suppliers.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px', color:'#8A9AB5' }}>
            <div style={{ fontSize:'36px', marginBottom:'10px' }}>🏭</div>
            <p style={{ fontWeight:'600', margin:0 }}>সরবরাহকারী নেই</p>
          </div>
        ) : suppliers.map(s => (
          <div key={s.id} style={{ background:'white', borderRadius:'14px', padding:'14px', boxShadow:'0 2px 8px rgba(15,40,80,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
              <div>
                <p style={{ margin:0, fontSize:'15px', fontWeight:'700', color:'#141D28' }}>{s.name}</p>
                {s.phone   && <p style={{ margin:'3px 0 0', fontSize:'13px', color:'#5E6E8A' }}>📞 {s.phone}</p>}
                {s.address && <p style={{ margin:'2px 0 0', fontSize:'12px', color:'#8A9AB5' }}>📍 {s.address}</p>}
              </div>
              {s.due_amount > 0 && (
                <p style={{ margin:0, fontWeight:'800', color:'#E63946', fontSize:'14px' }}>বাকি: {fmt(s.due_amount)}</p>
              )}
            </div>
            <button onClick={() => setShowPurchase(s)}
              style={{ width:'100%', padding:'10px', background:'#EBF2FF', color:'#0F4C81', border:'2px solid #0F4C81', borderRadius:'10px', fontWeight:'700', cursor:'pointer', fontSize:'13px', fontFamily:'inherit' }}>
              📦 ক্রয় এন্ট্রি করুন
            </button>
          </div>
        ))}
      </div>

      <AddSupplierModal visible={showAdd} saving={saving} onSave={handleAddSupplier} onClose={() => setShowAdd(false)} />
      <PurchaseModal supplier={showPurchase} products={products} visible={!!showPurchase} saving={saving} onSave={handleSavePurchase} onClose={() => setShowPurchase(null)} />
    </AppShell>
  );
}
