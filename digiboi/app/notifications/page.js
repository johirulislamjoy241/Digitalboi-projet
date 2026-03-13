'use client';
import { useState, useEffect } from 'react';
import { useAuthStore, useToastStore } from '@/lib/store';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [notifs, setNotifs] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSend, setShowSend] = useState(false);
  const [msgForm, setMsgForm] = useState({ title:'', message:'', type:'info', userId:'', toAll:false });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadNotifs(); }, []);

  const loadNotifs = async () => {
    setLoading(true);
    try {
      const [n, s] = await Promise.all([api.get('/api/notifications'), api.get('/api/staff').catch(()=>[])]);
      setNotifs(n); setStaff(s);
    } catch(e) { addToast(e.message,'error'); }
    finally { setLoading(false); }
  };

  const markAll = async () => {
    try { await api.patch('/api/notifications', { all: true }); loadNotifs(); addToast('সব পড়া হয়েছে'); }
    catch(e) { addToast(e.message,'error'); }
  };

  const sendMessage = async () => {
    if (!msgForm.title) { addToast('শিরোনাম দিন','error'); return; }
    setSaving(true);
    try {
      await api.post('/api/notifications', msgForm);
      addToast('বার্তা পাঠানো হয়েছে');
      setShowSend(false); setMsgForm({ title:'', message:'', type:'info', userId:'', toAll:false });
    } catch(e) { addToast(e.message,'error'); }
    finally { setSaving(false); }
  };

  const typeColor = { info:'#2E86DE', success:'#0BAA69', warning:'#F4A261', error:'#E63946' };
  const typeIcon = { info:'ℹ️', success:'✅', warning:'⚠️', error:'❌' };

  return (
    <AppShell title="নোটিফিকেশন">
      <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:'12px'}}>
        <div style={{display:'flex',gap:'10px'}}>
          <button onClick={markAll} style={{flex:1,padding:'11px',border:'2px solid #DDE4EE',borderRadius:'12px',background:'white',fontWeight:'600',cursor:'pointer',color:'#5E6E8A',fontSize:'13px',fontFamily:'inherit'}}>✓ সব পড়া হিসেবে চিহ্নিত</button>
          <button onClick={()=>setShowSend(true)} style={{flex:1,padding:'11px',border:'none',borderRadius:'12px',background:'#0F4C81',color:'white',fontWeight:'700',cursor:'pointer',fontSize:'13px',fontFamily:'inherit'}}>📤 বার্তা পাঠান</button>
        </div>

        {loading ? <div style={{textAlign:'center',padding:'40px',color:'#8A9AB5'}}>⏳ লোড হচ্ছে...</div> :
          notifs.length === 0 ? <div style={{textAlign:'center',padding:'40px',color:'#8A9AB5'}}>কোনো নোটিফিকেশন নেই</div> :
          notifs.map(n => (
            <div key={n.id} onClick={async()=>{ if(!n.is_read){await api.patch('/api/notifications',{id:n.id});loadNotifs();} }}
              style={{background:n.is_read?'white':'#EBF2FF',borderRadius:'14px',padding:'14px',boxShadow:'0 2px 8px rgba(15,40,80,0.06)',border:n.is_read?'2px solid transparent':`2px solid ${typeColor[n.type]||'#2E86DE'}`,cursor:'pointer'}}>
              <div style={{display:'flex',gap:'10px',alignItems:'flex-start'}}>
                <span style={{fontSize:'20px'}}>{typeIcon[n.type]||'ℹ️'}</span>
                <div style={{flex:1}}>
                  <p style={{margin:0,fontWeight:'700',fontSize:'14px',color:'#141D28'}}>{n.title}</p>
                  {n.message&&<p style={{margin:'4px 0 0',fontSize:'13px',color:'#5E6E8A'}}>{n.message}</p>}
                  <p style={{margin:'6px 0 0',fontSize:'11px',color:'#8A9AB5'}}>{new Date(n.created_at).toLocaleString('bn-BD')}</p>
                </div>
                {!n.is_read&&<div style={{width:'8px',height:'8px',background:'#0F4C81',borderRadius:'50%',flexShrink:0,marginTop:'4px'}}/>}
              </div>
            </div>
          ))
        }
      </div>

      {showSend && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'flex-end'}} onClick={()=>setShowSend(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:'white',borderRadius:'24px 24px 0 0',width:'100%',padding:'20px'}}>
            <p style={{margin:'0 0 16px',fontWeight:'800',fontSize:'16px',textAlign:'center',color:'#141D28'}}>বার্তা পাঠান</p>
            {[['শিরোনাম *','title'],['বার্তা','message']].map(([l,k])=>(
              <div key={k} style={{marginBottom:'12px'}}>
                <label style={{fontSize:'12px',fontWeight:'600',color:'#5E6E8A',display:'block',marginBottom:'6px'}}>{l}</label>
                <input value={msgForm[k]} onChange={e=>setMsgForm(f=>({...f,[k]:e.target.value}))} style={{width:'100%',padding:'12px',border:'2px solid #E8EDF5',borderRadius:'10px',fontSize:'14px',outline:'none',boxSizing:'border-box',fontFamily:"'Hind Siliguri',sans-serif"}}/>
              </div>
            ))}
            <div style={{marginBottom:'12px'}}>
              <label style={{fontSize:'12px',fontWeight:'600',color:'#5E6E8A',display:'block',marginBottom:'6px'}}>পাঠাবেন কাকে</label>
              <select value={msgForm.toAll?'all':msgForm.userId} onChange={e=>{
                if(e.target.value==='all')setMsgForm(f=>({...f,toAll:true,userId:''}));
                else setMsgForm(f=>({...f,toAll:false,userId:e.target.value}));
              }} style={{width:'100%',padding:'12px',border:'2px solid #E8EDF5',borderRadius:'10px',fontSize:'14px',outline:'none',fontFamily:"'Hind Siliguri',sans-serif"}}>
                <option value="all">সবাইকে</option>
                {staff.map(s=><option key={s.user_id} value={s.user_id}>{s.users?.full_name}</option>)}
              </select>
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>setShowSend(false)} style={{flex:1,padding:'13px',border:'2px solid #DDE4EE',borderRadius:'12px',background:'white',fontWeight:'600',cursor:'pointer',color:'#5E6E8A',fontFamily:'inherit'}}>বাতিল</button>
              <button onClick={sendMessage} disabled={saving} style={{flex:2,padding:'13px',background:'#0F4C81',color:'white',border:'none',borderRadius:'12px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'}}>{saving?'⏳...':'📤 পাঠান'}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
