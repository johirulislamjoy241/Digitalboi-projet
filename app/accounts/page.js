"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function Page() {
  const router = useRouter();
  useEffect(() => { router.replace("/"); }, [router]);
  return null;
}
const EXPENSE_CATS = ['ভাড়া','বিদ্যুৎ','কর্মচারী বেতন','পরিবহন','বিপণন','মেরামত','অফিস','অন্যান্য'];
const INP = { width:'100%', padding:'12px', border:'2px solid #E8EDF5', borderRadius:'10px', fontSize:'14px', outline:'none', boxSizing:'border-box', fontFamily:"'Hind Siliguri',sans-serif", background:'white' };
const LBL = { fontSize:'12px', fontWeight:'600', color:'#5E6E8A', display:'block', marginBottom:'6px' };
const today = () => new Date().toISOString().split('T')[0];
const EMPTY = { category:'অন্যান্য', description:'', amount:'', date:today() };

// ── AddExpenseModal — outside parent to prevent keyboard dismiss ───────────
function AddExpenseModal({ visible, saving, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const descRef = useRef();

  useEffect(() => {
    if (visible) { setForm({ ...EMPTY, date: today() }); setTimeout(() => descRef.current?.focus(), 100); }
  }, [visible]);

  if (!visible) return null;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background:'white', borderRadius:'24px 24px 0 0', width:'100%', padding:'20px 20px 32px' }}>
        <div style={{ width:'40px', height:'4px', background:'#DDE4EE', borderRadius:'4px', margin:'0 auto 14px' }} />
        <p style={{ margin:'0 0 16px', fontWeight:'800', fontSize:'16px', textAlign:'center', color:'#141D28' }}>নতুন খরচ</p>

        <div style={{ marginBottom:'12px' }}>
          <label style={LBL}>ক্যাটাগরি</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} style={{ ...INP }}>
            {EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ marginBottom:'12px' }}>
          <label style={LBL}>বিবরণ *</label>
          <input ref={descRef} type="text" value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="খরচের বিবরণ লিখুন" style={INP} autoComplete="off" />
        </div>

        <div style={{ marginBottom:'12px' }}>
          <label style={LBL}>পরিমাণ (৳) *</label>
          <input type="number" inputMode="decimal" value={form.amount} onChange={e => set('amount', e.target.value)}
            placeholder="০" style={INP} />
        </div>

        <div style={{ marginBottom:'18px' }}>
          <label style={LBL}>তারিখ</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={INP} />
        </div>

        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={onClose} style={{ flex:1, padding:'13px', border:'2px solid #DDE4EE', borderRadius:'12px', background:'white', fontWeight:'600', cursor:'pointer', color:'#5E6E8A', fontFamily:'inherit' }}>বাতিল</button>
          <button onClick={() => onSave(form)} disabled={saving}
            style={{ flex:2, padding:'13px', background: saving?'#E68C94':'linear-gradient(135deg,#E63946,#C1121F)', color:'white', border:'none', borderRadius:'12px', fontWeight:'700', cursor: saving?'default':'pointer', fontFamily:'inherit' }}>
            {saving ? '⏳ সংরক্ষণ...' : '✅ খরচ যোগ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AccountsPage() {
  const { addToast } = useToastStore();
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try { setExpenses(await api.get('/api/expenses')); }
    catch(e) { addToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleSave = async (form) => {
    if (!form.description.trim())          { addToast('বিবরণ দিন', 'error'); return; }
    if (!form.amount || Number(form.amount) <= 0) { addToast('সঠিক পরিমাণ দিন', 'error'); return; }
    setSaving(true);
    try {
      await api.post('/api/expenses', form);
      addToast('খরচ যোগ হয়েছে ✅');
      setShowAdd(false); loadExpenses();
    } catch(e) { addToast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const fmt = n => `৳${Number(n||0).toLocaleString('bn-BD')}`;
  const catTotals = expenses.reduce((m, e) => { m[e.category] = (m[e.category]||0) + Number(e.amount); return m; }, {});

  return (
    <AppShell title="হিসাব/খরচ">
      <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:'12px', paddingBottom:'24px' }}>

        {/* Total */}
        <div style={{ background:'linear-gradient(135deg,#E63946,#C1121F)', borderRadius:'16px', padding:'18px', color:'white', textAlign:'center' }}>
          <p style={{ margin:0, fontSize:'13px', opacity:0.8 }}>এই মাসের মোট খরচ</p>
          <p style={{ margin:'8px 0 0', fontSize:'28px', fontWeight:'800' }}>{fmt(totalExpenses)}</p>
        </div>

        {/* Category Breakdown */}
        {Object.entries(catTotals).length > 0 && (
          <div style={{ background:'white', borderRadius:'14px', padding:'14px', boxShadow:'0 2px 8px rgba(15,40,80,0.06)' }}>
            <p style={{ margin:'0 0 12px', fontWeight:'700', fontSize:'14px', color:'#141D28' }}>ক্যাটাগরি অনুযায়ী</p>
            {Object.entries(catTotals).sort(([,a],[,b]) => b-a).map(([cat, amt]) => (
              <div key={cat} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F0F4F8' }}>
                <span style={{ fontSize:'13px', color:'#141D28' }}>{cat}</span>
                <span style={{ fontWeight:'700', fontSize:'13px', color:'#E63946' }}>{fmt(amt)}</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setShowAdd(true)}
          style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#E63946,#C1121F)', color:'white', border:'none', borderRadius:'14px', fontSize:'15px', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}>
          + নতুন খরচ যোগ করুন
        </button>

        {/* Expense List */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'40px', color:'#8A9AB5' }}>⏳ লোড হচ্ছে...</div>
        ) : expenses.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px', color:'#8A9AB5' }}>
            <div style={{ fontSize:'36px', marginBottom:'10px' }}>💵</div>
            <p style={{ fontWeight:'600', margin:0 }}>কোনো খরচ নেই</p>
          </div>
        ) : expenses.map(e => (
          <div key={e.id} style={{ background:'white', borderRadius:'14px', padding:'14px', boxShadow:'0 2px 8px rgba(15,40,80,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <span style={{ fontSize:'11px', background:'#F0F4F8', color:'#5E6E8A', borderRadius:'8px', padding:'2px 8px', fontWeight:'600' }}>{e.category}</span>
              <p style={{ margin:'6px 0 0', fontSize:'13px', fontWeight:'600', color:'#141D28' }}>{e.description}</p>
              <p style={{ margin:'2px 0 0', fontSize:'11px', color:'#8A9AB5' }}>{e.date}</p>
            </div>
            <p style={{ margin:0, fontWeight:'800', fontSize:'16px', color:'#E63946' }}>{fmt(e.amount)}</p>
          </div>
        ))}
      </div>

      <AddExpenseModal visible={showAdd} saving={saving} onSave={handleSave} onClose={() => setShowAdd(false)} />
    </AppShell>
  );
}
