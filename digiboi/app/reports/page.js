'use client';
import { useState, useEffect } from 'react';
import { useToastStore } from '@/lib/store';
import AppShell from '@/components/layout/AppShell';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import api from '@/lib/api';

const COLORS = ['#0F4C81','#0BAA69','#E63946','#F4A261','#8B5CF6','#2E86DE'];
const PRESETS = [['এই মাস','thisMonth'],['গত মাস','lastMonth'],['এই বছর','thisYear']];

function getRange(preset) {
  const now = new Date();
  if (preset==='thisMonth') return { from:new Date(now.getFullYear(),now.getMonth(),1).toISOString().split('T')[0], to:now.toISOString().split('T')[0] };
  if (preset==='lastMonth') { const d=new Date(now.getFullYear(),now.getMonth()-1,1); return { from:d.toISOString().split('T')[0], to:new Date(now.getFullYear(),now.getMonth(),0).toISOString().split('T')[0] }; }
  return { from:new Date(now.getFullYear(),0,1).toISOString().split('T')[0], to:now.toISOString().split('T')[0] };
}

export default function ReportsPage() {
  const { addToast } = useToastStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('thisMonth');
  const [from, setFrom] = useState(getRange('thisMonth').from);
  const [to, setTo] = useState(getRange('thisMonth').to);

  useEffect(() => { const r=getRange(preset); setFrom(r.from); setTo(r.to); }, [preset]);
  useEffect(() => { loadReport(); }, [from, to]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const d = await api.get(`/api/reports?from=${from}&to=${to}`);
      setData(d);
    } catch(e) { addToast(e.message,'error'); }
    finally { setLoading(false); }
  };

  const fmt = n => `৳${Number(n||0).toLocaleString('bn-BD')}`;

  return (
    <AppShell title="রিপোর্ট">
      <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:'14px'}}>
        {/* Date Filter */}
        <div>
          <div style={{display:'flex',gap:'8px',marginBottom:'10px',overflowX:'auto'}}>
            {PRESETS.map(([l,k])=><button key={k} onClick={()=>setPreset(k)} style={{flexShrink:0,padding:'8px 16px',border:'none',borderRadius:'20px',background:preset===k?'#0F4C81':'#F0F4F8',color:preset===k?'white':'#5E6E8A',fontWeight:'700',cursor:'pointer',fontSize:'12px',fontFamily:'inherit'}}>{l}</button>)}
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            <input type="date" value={from} onChange={e=>{setFrom(e.target.value);setPreset('');}} style={{flex:1,padding:'10px',border:'2px solid #E8EDF5',borderRadius:'10px',fontSize:'13px',outline:'none',fontFamily:'inherit'}}/>
            <span style={{padding:'10px 4px',color:'#8A9AB5',fontSize:'13px'}}>—</span>
            <input type="date" value={to} onChange={e=>{setTo(e.target.value);setPreset('');}} style={{flex:1,padding:'10px',border:'2px solid #E8EDF5',borderRadius:'10px',fontSize:'13px',outline:'none',fontFamily:'inherit'}}/>
          </div>
        </div>

        {loading ? <div style={{textAlign:'center',padding:'40px',color:'#8A9AB5'}}>⏳ লোড হচ্ছে...</div> : data && <>
          {/* Summary Cards */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
            {[
              ['মোট বিক্রয়',fmt(data.totalSales),'💰','#0F4C81'],
              ['মোট লাভ',fmt(data.totalProfit),data.totalProfit>=0?'📈':'📉',data.totalProfit>=0?'#0BAA69':'#E63946'],
              ['মোট খরচ',fmt(data.totalExpenses),'💸','#E63946'],
              ['মোট ক্রয়',fmt(data.totalPurchase),'📦','#F4A261'],
              ['মোট অর্ডার',data.totalOrders,'🛒','#8B5CF6'],
              ['বাকি পাওনা',fmt(data.totalDue),'⏳','#E63946'],
            ].map(([l,v,icon,c])=>(
              <div key={l} style={{background:'white',borderRadius:'14px',padding:'14px',boxShadow:'0 2px 8px rgba(15,40,80,0.06)'}}>
                <p style={{margin:0,fontSize:'10px',color:'#8A9AB5',textTransform:'uppercase',letterSpacing:'0.4px'}}>{icon} {l}</p>
                <p style={{margin:'6px 0 0',fontSize:'20px',fontWeight:'800',color:c}}>{v}</p>
              </div>
            ))}
          </div>

          {/* Monthly Chart */}
          {data.monthlyChart?.length > 0 && (
            <div style={{background:'white',borderRadius:'14px',padding:'16px',boxShadow:'0 2px 8px rgba(15,40,80,0.06)'}}>
              <p style={{margin:'0 0 12px',fontWeight:'700',fontSize:'14px',color:'#141D28'}}>বিক্রয় চার্ট</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data.monthlyChart}>
                  <XAxis dataKey="name" tick={{fontSize:11,fill:'#8A9AB5'}}/>
                  <YAxis hide/>
                  <Tooltip formatter={v=>`৳${v.toLocaleString()}`}/>
                  <Bar dataKey="value" fill="#2E86DE" radius={[6,6,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Products */}
          {data.topProducts?.length > 0 && (
            <div style={{background:'white',borderRadius:'14px',padding:'16px',boxShadow:'0 2px 8px rgba(15,40,80,0.06)'}}>
              <p style={{margin:'0 0 12px',fontWeight:'700',fontSize:'14px',color:'#141D28'}}>সর্বোচ্চ বিক্রিত পণ্য</p>
              {data.topProducts.slice(0,5).map((p,i)=>(
                <div key={p.name} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #F0F4F8'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <span style={{width:'24px',height:'24px',background:COLORS[i%COLORS.length]+'20',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',fontWeight:'800',color:COLORS[i%COLORS.length]}}>{i+1}</span>
                    <span style={{fontSize:'13px',fontWeight:'600',color:'#141D28'}}>{p.name}</span>
                  </div>
                  <span style={{fontSize:'13px',fontWeight:'700',color:'#5E6E8A'}}>{p.qty} পিস</span>
                </div>
              ))}
            </div>
          )}

          {/* Payment Methods */}
          {data.paymentMethods&&Object.keys(data.paymentMethods).length>0&&(
            <div style={{background:'white',borderRadius:'14px',padding:'16px',boxShadow:'0 2px 8px rgba(15,40,80,0.06)'}}>
              <p style={{margin:'0 0 12px',fontWeight:'700',fontSize:'14px',color:'#141D28'}}>পেমেন্ট মাধ্যম</p>
              {Object.entries(data.paymentMethods).map(([m,v])=>(
                <div key={m} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #F0F4F8'}}>
                  <span style={{fontSize:'13px',color:'#141D28',textTransform:'capitalize'}}>{m}</span>
                  <span style={{fontWeight:'700',fontSize:'13px',color:'#0F4C81'}}>{fmt(v)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Print */}
          <button onClick={()=>window.print()} style={{width:'100%',padding:'14px',background:'white',border:'2px solid #0F4C81',borderRadius:'14px',color:'#0F4C81',fontSize:'15px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'}}>🖨️ রিপোর্ট প্রিন্ট করুন</button>
        </>}
      </div>
    </AppShell>
  );
}
