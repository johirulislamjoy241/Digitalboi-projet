'use client';
import { useState, useEffect, useCallback } from 'react';
import { useToastStore } from '@/lib/store';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────
// KEYBOARD BUG FIX:
// আগে ProductForm টি InventoryPage-এর ভেতরে define ছিল।
// প্রতিটি keystroke → parent re-render → ProductForm নতুন function →
// React unmount+remount করতো → keyboard dismiss / focus হারিয়ে যেত।
//
// FIX: ProductForm এবং QRModal দুটোকে TOP-LEVEL component হিসেবে
// parent-এর বাইরে নিয়ে আসা হয়েছে। এখন re-render হলেও component
// same identity রাখে — keyboard সরে না।
// ─────────────────────────────────────────────────────────────────────────

const UNITS = ['পিস', 'কেজি', 'গ্রাম', 'লিটার', 'মিলি', 'বক্স', 'ডজন', 'প্যাকেট', 'বোতল'];

const sty = {
  inp: {
    width: '100%', padding: '12px', border: '2px solid #E8EDF5',
    borderRadius: '10px', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', fontFamily: "'Hind Siliguri',sans-serif",
    WebkitAppearance: 'none', background: 'white',
  },
  lbl: {
    fontSize: '12px', fontWeight: '600', color: '#5E6E8A',
    display: 'block', marginBottom: '5px',
  },
};

// ── ProductFormModal — parent-এর বাইরে ─────────────────────────────────
function ProductFormModal({ form, onChange, categories, isEdit, saving, onSave, onClose }) {
  const fields = [
    ['পণ্যের নাম *',        'name',          'text',   'যেমন: Nido দুধ'],
    ['বিক্রয় মূল্য (৳) *', 'sellingPrice',  'number', '০.০০'],
    ['ক্রয় মূল্য (৳)',     'costPrice',     'number', '০.০০'],
    ['স্টক পরিমাণ',         'stockQuantity', 'number', '০'],
    ['সর্বনিম্ন স্টক সীমা', 'minStockAlert', 'number', '৫'],
    ['Barcode / SKU',       'barcode',       'text',   'ঐচ্ছিক'],
  ];

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1000, display:'flex', alignItems:'flex-end' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:'white', borderRadius:'24px 24px 0 0', width:'100%', maxHeight:'92vh', overflowY:'auto', padding:'20px 20px 36px' }}
      >
        <div style={{ width:'40px', height:'4px', background:'#DDE4EE', borderRadius:'4px', margin:'0 auto 16px' }} />
        <p style={{ margin:'0 0 18px', fontWeight:'800', fontSize:'16px', color:'#141D28', textAlign:'center' }}>
          {isEdit ? '✏️ পণ্য সম্পাদনা' : '+ নতুন পণ্য যোগ'}
        </p>

        {fields.map(([label, key, type, placeholder]) => (
          <div key={key} style={{ marginBottom:'13px' }}>
            <label style={sty.lbl}>{label}</label>
            <input
              type={type}
              inputMode={type === 'number' ? 'decimal' : 'text'}
              value={form[key]}
              onChange={e => onChange(key, e.target.value)}
              placeholder={placeholder}
              style={sty.inp}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        ))}

        <div style={{ marginBottom:'13px' }}>
          <label style={sty.lbl}>ক্যাটাগরি</label>
          <select
            value={form.categoryId}
            onChange={e => onChange('categoryId', e.target.value)}
            style={sty.inp}
          >
            <option value="">-- ক্যাটাগরি বাছুন --</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom:'22px' }}>
          <label style={sty.lbl}>একক</label>
          <select value={form.unit} onChange={e => onChange('unit', e.target.value)} style={sty.inp}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div style={{ display:'flex', gap:'10px' }}>
          <button
            onClick={onClose}
            style={{ flex:1, padding:'14px', border:'2px solid #DDE4EE', borderRadius:'14px', background:'white', fontWeight:'600', cursor:'pointer', color:'#5E6E8A', fontFamily:'inherit', fontSize:'14px' }}
          >
            বাতিল
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            style={{ flex:2, padding:'14px', background: saving ? '#93B5D9' : 'linear-gradient(135deg,#0F4C81,#2E86DE)', color:'white', border:'none', borderRadius:'14px', fontSize:'15px', fontWeight:'700', cursor: saving ? 'default' : 'pointer', fontFamily:'inherit' }}
          >
            {saving ? '⏳ সংরক্ষণ হচ্ছে...' : isEdit ? '✅ আপডেট করুন' : '✅ পণ্য যোগ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── QRModal — parent-এর বাইরে ──────────────────────────────────────────
function QRModal({ product, onClose }) {
  if (!product) return null;
  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'20px', padding:'24px', width:'100%', maxWidth:'320px', textAlign:'center' }}>
        <p style={{ margin:'0 0 16px', fontWeight:'700', fontSize:'16px', color:'#141D28' }}>{product.name}</p>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${product.id}&bgcolor=FFFFFF&color=0F4C81`}
          alt="QR Code"
          style={{ width:'200px', height:'200px', borderRadius:'12px' }}
        />
        <p style={{ margin:'12px 0 6px', fontSize:'12px', color:'#8A9AB5' }}>
          QR scan করলে POS-এ পণ্যটি সরাসরি যোগ হবে
        </p>
        {product.barcode && (
          <p style={{ margin:'6px 0', fontWeight:'700', fontSize:'18px', letterSpacing:'3px', color:'#141D28' }}>{product.barcode}</p>
        )}
        <div style={{ display:'flex', gap:'8px', marginTop:'14px' }}>
          <button onClick={() => window.print()} style={{ flex:1, padding:'10px', background:'#0F4C81', color:'white', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'600', fontFamily:'inherit' }}>🖨️ প্রিন্ট</button>
          <button onClick={onClose} style={{ flex:1, padding:'10px', border:'none', background:'#F0F4F8', borderRadius:'10px', cursor:'pointer', color:'#5E6E8A', fontWeight:'600', fontFamily:'inherit' }}>বন্ধ</button>
        </div>
      </div>
    </div>
  );
}

// ── EMPTY FORM constant — component-এর বাইরে (re-render-এ নতুন object হয় না) ──
const EMPTY_FORM = {
  name:'', description:'', categoryId:'', barcode:'', sku:'',
  unit:'পিস', costPrice:'', sellingPrice:'', stockQuantity:'0', minStockAlert:'5',
};

// ── Main Page ──────────────────────────────────────────────────────────
export default function InventoryPage() {
  const { addToast } = useToastStore();
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [selCat,     setSelCat]     = useState('');
  const [lowStock,   setLowStock]   = useState(false);
  const [showAdd,    setShowAdd]    = useState(false);
  const [showEdit,   setShowEdit]   = useState(null);
  const [showQR,     setShowQR]     = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [form,       setForm]       = useState(EMPTY_FORM);

  // useCallback — প্রতি render-এ নতুন function তৈরি হবে না
  const handleChange = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleClose = useCallback(() => {
    setShowAdd(false);
    setShowEdit(null);
    setForm(EMPTY_FORM);
  }, []);

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadProducts(); }, [search, selCat, lowStock]);

  const loadCategories = async () => {
    try {
      const cats = await api.get('/api/categories');
      setCategories(cats);
    } catch {}
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)   params.set('search',   search);
      if (selCat)   params.set('category', selCat);
      if (lowStock) params.set('lowStock', 'true');
      const data = await api.get('/api/products?' + params.toString());
      setProducts(data);
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveProduct = async () => {
    if (!form.name.trim())         { addToast('পণ্যের নাম দিন', 'error'); return; }
    if (!form.sellingPrice)        { addToast('বিক্রয় মূল্য দিন', 'error'); return; }
    if (Number(form.sellingPrice) <= 0) { addToast('সঠিক বিক্রয় মূল্য দিন', 'error'); return; }

    setSaving(true);
    try {
      if (showEdit) {
        await api.patch(`/api/products/${showEdit.id}`, form);
        addToast('পণ্য আপডেট হয়েছে ✅');
        setShowEdit(null);
      } else {
        await api.post('/api/products', form);
        addToast('নতুন পণ্য যোগ হয়েছে ✅');
        setShowAdd(false);
      }
      setForm(EMPTY_FORM);
      loadProducts();
    } catch (e) {
      addToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (p) => {
    setForm({
      name:          p.name              || '',
      description:   p.description       || '',
      categoryId:    p.category_id       || '',
      barcode:       p.barcode           || '',
      sku:           p.sku               || '',
      unit:          p.unit              || 'পিস',
      costPrice:     String(p.cost_price    ?? ''),
      sellingPrice:  String(p.selling_price ?? ''),
      stockQuantity: String(p.stock_quantity ?? 0),
      minStockAlert: String(p.min_stock_alert ?? 5),
    });
    setShowEdit(p);
  };

  const deleteProduct = async (id) => {
    if (!confirm('পণ্যটি মুছে ফেলবেন?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      addToast('পণ্য মুছে গেছে');
      loadProducts();
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const fmt = n => `৳${Number(n || 0).toLocaleString('bn-BD')}`;

  return (
    <AppShell title="পণ্য তালিকা">
      <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:'12px', paddingBottom:'24px' }}>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 পণ্য খুঁজুন..."
          style={{ width:'100%', padding:'12px', border:'2px solid #E8EDF5', borderRadius:'12px', fontSize:'14px', outline:'none', boxSizing:'border-box', fontFamily:"'Hind Siliguri',sans-serif" }}
        />

        {/* Filters */}
        <div style={{ display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'4px' }}>
          <button
            onClick={() => setLowStock(v => !v)}
            style={{ flexShrink:0, padding:'6px 12px', borderRadius:'20px', border:'none', background:lowStock?'#E63946':'#F0F4F8', color:lowStock?'white':'#5E6E8A', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}
          >⚠️ কম স্টক</button>
          <button
            onClick={() => setSelCat('')}
            style={{ flexShrink:0, padding:'6px 12px', borderRadius:'20px', border:'none', background:!selCat?'#0F4C81':'#F0F4F8', color:!selCat?'white':'#5E6E8A', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}
          >সব</button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setSelCat(c.id)} style={{ flexShrink:0, padding:'6px 12px', borderRadius:'20px', border:'none', background:selCat===c.id?c.color||'#0F4C81':'#F0F4F8', color:selCat===c.id?'white':'#5E6E8A', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:'10px' }}>
          <div style={{ flex:1, background:'white', borderRadius:'12px', padding:'12px', boxShadow:'0 2px 8px rgba(15,40,80,0.06)' }}>
            <p style={{ margin:0, fontSize:'11px', color:'#8A9AB5' }}>মোট পণ্য</p>
            <p style={{ margin:'4px 0 0', fontSize:'20px', fontWeight:'800', color:'#141D28' }}>{products.length}</p>
          </div>
          <div style={{ flex:1, background:'white', borderRadius:'12px', padding:'12px', boxShadow:'0 2px 8px rgba(15,40,80,0.06)' }}>
            <p style={{ margin:0, fontSize:'11px', color:'#E63946' }}>কম/শেষ স্টক</p>
            <p style={{ margin:'4px 0 0', fontSize:'20px', fontWeight:'800', color:'#E63946' }}>
              {products.filter(p => p.stock_quantity <= p.min_stock_alert).length}
            </p>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={() => { setForm(EMPTY_FORM); setShowAdd(true); }}
          style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#0F4C81,#2E86DE)', color:'white', border:'none', borderRadius:'14px', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}
        >
          + নতুন পণ্য যোগ করুন
        </button>

        {/* Product List */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'40px', color:'#8A9AB5' }}>
            <div style={{ width:'32px', height:'32px', border:'3px solid #DDE4EE', borderTopColor:'#0F4C81', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />
            লোড হচ্ছে...
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px', color:'#8A9AB5' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>📦</div>
            <p style={{ fontWeight:'600', margin:'0 0 6px' }}>কোনো পণ্য নেই</p>
            <p style={{ fontSize:'13px', margin:0 }}>উপরের বাটনে ক্লিক করে পণ্য যোগ করুন</p>
          </div>
        ) : (
          products.map(p => (
            <div key={p.id} style={{ background:'white', borderRadius:'14px', padding:'14px', boxShadow:'0 2px 8px rgba(15,40,80,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'8px' }}>
                <div style={{ flex:1, marginRight:'10px' }}>
                  <p style={{ margin:'0 0 4px', fontSize:'14px', fontWeight:'700', color:'#141D28' }}>{p.name}</p>
                  {p.categories && (
                    <span style={{ fontSize:'11px', background:(p.categories.color||'#0F4C81')+'20', color:p.categories.color||'#0F4C81', padding:'2px 8px', borderRadius:'10px', fontWeight:'600' }}>
                      {p.categories.icon} {p.categories.name}
                    </span>
                  )}
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <p style={{ margin:'0 0 2px', fontSize:'16px', fontWeight:'800', color:'#0F4C81' }}>{fmt(p.selling_price)}</p>
                  <p style={{ margin:0, fontSize:'11px', color:'#8A9AB5' }}>ক্রয়: {fmt(p.cost_price)}</p>
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontSize:'13px', color:'#141D28', fontWeight:'600' }}>স্টক: {p.stock_quantity} {p.unit}</span>
                  {p.stock_quantity <= 0 && (
                    <span style={{ fontSize:'11px', background:'#FEE2E2', color:'#991B1B', borderRadius:'8px', padding:'2px 8px', fontWeight:'700' }}>শেষ!</span>
                  )}
                  {p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_alert && (
                    <span style={{ fontSize:'11px', background:'#FEF3C7', color:'#92400E', borderRadius:'8px', padding:'2px 8px', fontWeight:'700' }}>কম!</span>
                  )}
                </div>
                {p.barcode && <span style={{ fontSize:'11px', color:'#8A9AB5' }}>#{p.barcode}</span>}
              </div>

              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => openEdit(p)} style={{ flex:1, padding:'8px', border:'2px solid #0F4C81', borderRadius:'10px', background:'#EBF2FF', color:'#0F4C81', fontWeight:'600', cursor:'pointer', fontSize:'12px', fontFamily:'inherit' }}>✏️ সম্পাদনা</button>
                <button onClick={() => setShowQR(p)} style={{ flex:1, padding:'8px', border:'2px solid #8B5CF6', borderRadius:'10px', background:'#F3F0FF', color:'#8B5CF6', fontWeight:'600', cursor:'pointer', fontSize:'12px', fontFamily:'inherit' }}>📷 QR কোড</button>
                <button onClick={() => deleteProduct(p.id)} style={{ flex:1, padding:'8px', border:'2px solid #E63946', borderRadius:'10px', background:'#FEE2E2', color:'#E63946', fontWeight:'600', cursor:'pointer', fontSize:'12px', fontFamily:'inherit' }}>🗑 মুছুন</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals — parent-এর বাইরে define করা, তাই keyboard কখনো dismiss হবে না */}
      {(showAdd || showEdit) && (
        <ProductFormModal
          form={form}
          onChange={handleChange}
          categories={categories}
          isEdit={!!showEdit}
          saving={saving}
          onSave={saveProduct}
          onClose={handleClose}
        />
      )}
      <QRModal product={showQR} onClose={() => setShowQR(null)} />
    </AppShell>
  );
}
