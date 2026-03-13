'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToastStore } from '@/lib/store';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';

const INP = { width:'100%', padding:'12px', border:'2px solid #E8EDF5', borderRadius:'10px', fontSize:'14px', outline:'none', boxSizing:'border-box', fontFamily:"'Hind Siliguri',sans-serif", background:'white' };
const LBL = { fontSize:'12px', fontWeight:'600', color:'#5E6E8A', display:'block', marginBottom:'5px' };
const EMPTY = { name:'', phone:'', address:'', notes:'' };

// ── Modal components defined OUTSIDE to prevent re-mount on parent re-render ──

function AddCustomerModal({ visible, saving, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const nameRef = useRef();

  useEffect(() => {
    if (visible) { setForm(EMPTY); setTimeout(() => nameRef.current?.focus(), 100); }
  }, [visible]);

  if (!visible) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'24px 24px 0 0', width:'100%', padding:'20px 20px 32px' }}>
        <div style={{ width:'40px', height:'4px', background:'#DDE4EE', borderRadius:'4px', margin:'0 auto 14px' }} />
        <p style={{ margin:'0 0 16px', fontWeight:'800', fontSize:'16px', textAlign:'center', color:'#141D28' }}>নতুন গ্রাহক</p>
        {[['নাম *','name','text'],['ফোন','phone','tel'],['ঠিকানা','address','text']].map(([l,k,t], i) => (
          <div key={k} style={{ marginBottom:'12px' }}>
            <label style={LBL}>{l}</label>
            <input ref={i===0?nameRef:undefined} type={t} value={form[k]} onChange={e => set(k, e.target.value)}
              style={INP} autoComplete="off" />
          </div>
        ))}
        <div style={{ display:'flex', gap:'10px', marginTop:'8px' }}>
          <button onClick={onClose} style={{ flex:1, padding:'13px', border:'2px solid #DDE4EE', borderRadius:'12px', background:'white', fontWeight:'600', cursor:'pointer', color:'#5E6E8A', fontFamily:'inherit' }}>বাতিল</button>
          <button onClick={() => onSave(form)} disabled={saving}
            style={{ flex:2, padding:'13px', background: saving?'#93B5D9':'linear-gradient(135deg,#0F4C81,#2E86DE)', color:'white', border:'none', borderRadius:'12px', fontWeight:'700', cursor: saving?'default':'pointer', fontFamily:'inherit' }}>
            {saving ? '⏳ সংরক্ষণ...' : '✅ যোগ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PayModal({ visible, customer, saving, onPay, onClose }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const inputRef = useRef();

  useEffect(() => {
    if (visible) { setAmount(''); setMethod('cash'); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [visible]);

  if (!visible || !customer) return null;
  const fmt = n => `৳${Number(n||0).toLocaleString('bn-BD')}`;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'24px 24px 0 0', width:'100%', padding:'20px 20px 32px' }}>
        <div style={{ width:'40px', height:'4px', background:'#DDE4EE', borderRadius:'4px', margin:'0 auto 14px' }} />
        <p style={{ margin:'0 0 4px', fontWeight:'800', fontSize:'16px', textAlign:'center', color:'#141D28' }}>💰 বাকি আদায়</p>
        <p style={{ margin:'0 0 16px', fontSize:'13px', textAlign:'center', color:'#5E6E8A' }}>{customer.name} — বাকি: {fmt(customer.due_amount)}</p>
        <label style={LBL}>পরিমাণ (৳)</label>
        <input ref={inputRef} type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder={String(customer.due_amount)} style={{ ...INP, fontSize:'18px', padding:'14px', marginBottom:'12px' }} />
        {/* Quick amount buttons */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'14px', flexWrap:'wrap' }}>
          {[customer.due_amount, 500, 1000, 2000].filter((v,i,a) => a.indexOf(v)===i && v <= customer.due_amount).slice(0,4).map(v => (
            <button key={v} onClick={() => setAmount(String(v))}
              style={{ padding:'7px 14px', background: Number(amount)===v?'#0F4C81':'#EBF2FF', color: Number(amount)===v?'white':'#0F4C81', border:'none', borderRadius:'8px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>
              ৳{v}
            </button>
          ))}
        </div>
        <label style={LBL}>পেমেন্ট মাধ্যম</label>
        <div style={{ display:'flex', gap:'8px', marginBottom:'18px', flexWrap:'wrap' }}>
          {[['cash','💵 নগদ'],['bkash','💗 bKash'],['nagad','💛 নগদ']].map(([k,l]) => (
            <button key={k} onClick={() => setMethod(k)}
              style={{ padding:'8px 16px', border:`2px solid ${method===k?'#0F4C81':'#DDE4EE'}`, borderRadius:'10px', background: method===k?'#EBF2FF':'white', color: method===k?'#0F4C81':'#5E6E8A', fontWeight:'600', fontSize:'13px', cursor:'pointer', fontFamily:'inherit' }}>
              {l}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={onClose} style={{ flex:1, padding:'13px', border:'2px solid #DDE4EE', borderRadius:'12px', background:'white', fontWeight:'600', cursor:'pointer', color:'#5E6E8A', fontFamily:'inherit' }}>বাতিল</button>
          <button onClick={() => onPay(amount, method)} disabled={saving}
            style={{ flex:2, padding:'13px', background: saving?'#6BC9A0':'linear-gradient(135deg,#0BAA69,#059669)', color:'white', border:'none', borderRadius:'12px', fontWeight:'700', cursor: saving?'default':'pointer', fontFamily:'inherit' }}>
            {saving ? '⏳ প্রক্রিয়া...' : '✅ পেমেন্ট নিন'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const { addToast } = useToastStore();
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [hasDue,    setHasDue]    = useState(false);
  const [showAdd,   setShowAdd]   = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [showPay,   setShowPay]   = useState(false);
  const [saving,    setSaving]    = useState(false);

  useEffect(() => { loadCustomers(); }, [search, hasDue]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (hasDue) params.set('hasDue', 'true');
      setCustomers(await api.get('/api/customers?' + params));
    } catch(e) { addToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleAddSave = async (form) => {
    if (!form.name.trim()) { addToast('নাম দিন', 'error'); return; }
    setSaving(true);
    try {
      await api.post('/api/customers', form);
      addToast('গ্রাহক যোগ হয়েছে ✅');
      setShowAdd(false);
      loadCustomers();
    } catch(e) { addToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handlePay = async (amount, method) => {
    if (!amount || Number(amount) <= 0) { addToast('পরিমাণ দিন', 'error'); return; }
    setSaving(true);
    try {
      await api.patch(`/api/customers/${selected.id}`, { action:'pay', amount: Number(amount), method });
      addToast('পেমেন্ট গৃহীত হয়েছে ✅');
      setShowPay(false); setSelected(null);
      loadCustomers();
    } catch(e) { addToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const fmt = n => `৳${Number(n||0).toLocaleString('bn-BD')}`;

  return (
    <AppShell title="গ্রাহক">
      <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:'12px', paddingBottom:'24px' }}>

        <div style={{ display:'flex', gap:'10px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 গ্রাহক খুঁজুন..."
            style={{ flex:1, padding:'11px', border:'2px solid #E8EDF5', borderRadius:'12px', fontSize:'14px', outline:'none', fontFamily:"'Hind Siliguri',sans-serif" }} />
          <button onClick={() => setHasDue(v => !v)}
            style={{ padding:'11px 14px', border:`2px solid ${hasDue?'#E63946':'#DDE4EE'}`, borderRadius:'12px', background:hasDue?'#FEE2E2':'white', color:hasDue?'#E63946':'#5E6E8A', fontWeight:'600', cursor:'pointer', fontSize:'13px', fontFamily:'inherit', whiteSpace:'nowrap' }}>
            ⏳ বাকি
          </button>
        </div>

        <div style={{ display:'flex', gap:'10px' }}>
          {[['মোট গ্রাহক', customers.length, '#0F4C81'], ['বাকি আছে', customers.filter(c => c.due_amount > 0).length, '#E63946']].map(([l,v,c]) => (
            <div key={l} style={{ flex:1, background:'white', borderRadius:'12px', padding:'12px', boxShadow:'0 2px 8px rgba(15,40,80,0.06)' }}>
              <p style={{ margin:0, fontSize:'11px', color:'#8A9AB5' }}>{l}</p>
              <p style={{ margin:'4px 0 0', fontSize:'22px', fontWeight:'800', color:c }}>{v}</p>
            </div>
          ))}
        </div>

        <button onClick={() => setShowAdd(true)}
          style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#0F4C81,#2E86DE)', color:'white', border:'none', borderRadius:'14px', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}>
          + নতুন গ্রাহক যোগ করুন
        </button>

        {loading ? (
          <div style={{ textAlign:'center', padding:'40px', color:'#8A9AB5' }}>⏳ লোড হচ্ছে...</div>
        ) : customers.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px', color:'#8A9AB5' }}>
            <div style={{ fontSize:'36px', marginBottom:'10px' }}>👥</div>
            <p style={{ fontWeight:'600', margin:0 }}>গ্রাহক নেই</p>
          </div>
        ) : customers.map(c => (
          <div key={c.id} style={{ background:'white', borderRadius:'14px', padding:'14px', boxShadow:'0 2px 8px rgba(15,40,80,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
              <div>
                <p style={{ margin:0, fontSize:'15px', fontWeight:'700', color:'#141D28' }}>{c.name}</p>
                {c.phone   && <p style={{ margin:'3px 0 0', fontSize:'13px', color:'#5E6E8A' }}>📞 {c.phone}</p>}
                {c.address && <p style={{ margin:'2px 0 0', fontSize:'12px', color:'#8A9AB5' }}>📍 {c.address}</p>}
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ margin:0, fontSize:'13px', color:'#5E6E8A' }}>মোট ক্রয়: {fmt(c.total_purchase)}</p>
                {c.due_amount > 0
                  ? <p style={{ margin:'4px 0 0', fontSize:'15px', fontWeight:'800', color:'#E63946' }}>বাকি: {fmt(c.due_amount)}</p>
                  : <span style={{ fontSize:'11px', background:'#D1FAE5', color:'#065F46', borderRadius:'10px', padding:'3px 10px', fontWeight:'700' }}>✓ পরিশোধ</span>}
              </div>
            </div>
            {c.due_amount > 0 && (
              <button onClick={() => { setSelected(c); setShowPay(true); }}
                style={{ width:'100%', padding:'10px', background:'#0BAA69', color:'white', border:'none', borderRadius:'10px', fontWeight:'700', cursor:'pointer', fontSize:'13px', fontFamily:'inherit' }}>
                💰 বাকি আদায় করুন — {fmt(c.due_amount)}
              </button>
            )}
          </div>
        ))}
      </div>

      <AddCustomerModal visible={showAdd} saving={saving} onSave={handleAddSave} onClose={() => setShowAdd(false)} />
      <PayModal visible={showPay} customer={selected} saving={saving} onPay={handlePay} onClose={() => { setShowPay(false); setSelected(null); }} />
    </AppShell>
  );
}
