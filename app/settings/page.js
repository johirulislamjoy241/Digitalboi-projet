'use client';
import { useState, useEffect } from 'react';
import { useAuthStore, useToastStore } from '@/lib/store';
import AppShell from '@/components/layout/AppShell';
import api from '@/lib/api';

export default function SettingsPage() {
  const { user, shop, setAuth, token } = useAuthStore();
  const { addToast } = useToastStore();
  const [tab, setTab] = useState('shop');
  const [shopData, setShopData] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [shopForm, setShopForm] = useState({});
  const [passForm, setPassForm] = useState({ oldPassword:'', newPassword:'', confirmPassword:'' });
  const [staffForm, setStaffForm] = useState({ fullName:'', phone:'', password:'', role:'cashier' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, st] = await Promise.all([
        api.get('/api/shop').catch(()=>null),
        api.get('/api/staff').catch(()=>[])
      ]);
      setShopData(s); setShopForm(s||{});
      setStaff(st);
    } catch(e) {} finally { setLoading(false); }
  };

  const saveShop = async () => {
    setSaving(true);
    try {
      const updated = await api.patch('/api/shop', shopForm);
      setShopData(updated);
      addToast('দোকানের তথ্য আপডেট হয়েছে');
    } catch(e) { addToast(e.message,'error'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!passForm.oldPassword||!passForm.newPassword) { addToast('সব তথ্য দিন','error'); return; }
    if (passForm.newPassword.length < 8) { addToast('নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষর','error'); return; }
    if (passForm.newPassword !== passForm.confirmPassword) { addToast('পাসওয়ার্ড মিলছে না','error'); return; }
    setSaving(true);
    try {
      await api.patch('/api/profile', { action:'change_password', ...passForm });
      addToast('পাসওয়ার্ড পরিবর্তন হয়েছে');
      setPassForm({ oldPassword:'', newPassword:'', confirmPassword:'' });
    } catch(e) { addToast(e.message,'error'); }
    finally { setSaving(false); }
  };

  const addStaff = async () => {
    if (!staffForm.fullName||!staffForm.phone||!staffForm.password) { addToast('সব তথ্য দিন','error'); return; }
    setSaving(true);
    try {
      await api.post('/api/staff', staffForm);
      addToast('স্টাফ যোগ হয়েছে');
      setShowAddStaff(false); setStaffForm({ fullName:'', phone:'', password:'', role:'cashier' });
      loadAll();
    } catch(e) { addToast(e.message,'error'); }
    finally { setSaving(false); }
  };

  const removeStaff = async (id) => {
    if (!confirm('স্টাফ সরাবেন?')) return;
    try { await api.delete(`/api/staff/${id}`); addToast('স্টাফ সরানো হয়েছে'); loadAll(); }
    catch(e) { addToast(e.message,'error'); }
  };

  const tabs = [['shop','🏪 দোকান'],['staff','👤 স্টাফ'],['password','🔒 পাসওয়ার্ড']];

  if (loading) return <AppShell title="সেটিংস"><div style={{textAlign:'center',padding:'40px',color:'#8A9AB5'}}>⏳ লোড হচ্ছে...</div></AppShell>;

  return (
    <AppShell title="সেটিংস">
      <div style={{padding:'12px 16px',display:'flex',flexDirection:'column',gap:'12px'}}>
        {/* Tabs */}
        <div style={{display:'flex',background:'#F0F4F8',borderRadius:'14px',padding:'4px',gap:'4px'}}>
          {tabs.map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:'10px',border:'none',borderRadius:'10px',background:tab===k?'white':'transparent',color:tab===k?'#0F4C81':'#5E6E8A',fontWeight:'700',cursor:'pointer',fontSize:'12px',boxShadow:tab===k?'0 2px 8px rgba(0,0,0,0.1)':'none',fontFamily:'inherit'}}>{l}</button>)}
        </div>

        {/* Shop Settings */}
        {tab==='shop'&&shopData&&(
          <div style={{background:'white',borderRadius:'14px',padding:'16px',boxShadow:'0 2px 8px rgba(15,40,80,0.06)'}}>
            {[['দোকানের নাম','shop_name'],['ঠিকানা','address'],['ফোন','phone'],['ইমেইল','email'],['Facebook Page','fb_page_url'],['Website','website_url']].map(([l,k])=>(
              <div key={k} style={{marginBottom:'12px'}}>
                <label style={{fontSize:'12px',fontWeight:'600',color:'#5E6E8A',display:'block',marginBottom:'5px'}}>{l}</label>
                <input value={shopForm[k]||''} onChange={e=>setShopForm(f=>({...f,[k]:e.target.value}))} style={{width:'100%',padding:'12px',border:'2px solid #E8EDF5',borderRadius:'10px',fontSize:'14px',outline:'none',boxSizing:'border-box',fontFamily:"'Hind Siliguri',sans-serif"}}/>
              </div>
            ))}
            <button onClick={saveShop} disabled={saving} style={{width:'100%',padding:'14px',background:'linear-gradient(135deg,#0F4C81,#2E86DE)',color:'white',border:'none',borderRadius:'12px',fontSize:'15px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'}}>{saving?'⏳ সংরক্ষণ...':'✅ পরিবর্তন সংরক্ষণ করুন'}</button>
          </div>
        )}

        {/* Staff */}
        {tab==='staff'&&(
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            {user?.role==='owner'&&<button onClick={()=>setShowAddStaff(true)} style={{width:'100%',padding:'14px',background:'linear-gradient(135deg,#0BAA69,#059669)',color:'white',border:'none',borderRadius:'14px',fontSize:'15px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'}}>+ নতুন স্টাফ যোগ করুন</button>}
            {staff.length===0?<div style={{textAlign:'center',padding:'40px',color:'#8A9AB5'}}>কোনো স্টাফ নেই</div>:
              staff.map(s=>(
                <div key={s.id} style={{background:'white',borderRadius:'14px',padding:'14px',boxShadow:'0 2px 8px rgba(15,40,80,0.06)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <p style={{margin:0,fontSize:'14px',fontWeight:'700',color:'#141D28'}}>{s.users?.full_name}</p>
                    <p style={{margin:'3px 0 0',fontSize:'12px',color:'#5E6E8A'}}>📞 {s.users?.phone} • {s.role}</p>
                    {s.users?.last_login&&<p style={{margin:'2px 0 0',fontSize:'11px',color:'#8A9AB5'}}>শেষ লগইন: {new Date(s.users.last_login).toLocaleDateString('bn-BD')}</p>}
                  </div>
                  {user?.role==='owner'&&<button onClick={()=>removeStaff(s.id)} style={{padding:'8px 14px',background:'#FEE2E2',color:'#E63946',border:'none',borderRadius:'10px',fontWeight:'600',cursor:'pointer',fontSize:'13px',fontFamily:'inherit'}}>সরান</button>}
                </div>
              ))
            }
          </div>
        )}

        {/* Password */}
        {tab==='password'&&(
          <div style={{background:'white',borderRadius:'14px',padding:'16px',boxShadow:'0 2px 8px rgba(15,40,80,0.06)'}}>
            {[['পুরনো পাসওয়ার্ড *','oldPassword'],['নতুন পাসওয়ার্ড *','newPassword'],['নিশ্চিত করুন *','confirmPassword']].map(([l,k])=>(
              <div key={k} style={{marginBottom:'12px'}}>
                <label style={{fontSize:'12px',fontWeight:'600',color:'#5E6E8A',display:'block',marginBottom:'5px'}}>{l}</label>
                <input type="password" value={passForm[k]} onChange={e=>setPassForm(f=>({...f,[k]:e.target.value}))} style={{width:'100%',padding:'12px',border:'2px solid #E8EDF5',borderRadius:'10px',fontSize:'14px',outline:'none',boxSizing:'border-box',fontFamily:"'Hind Siliguri',sans-serif"}}/>
              </div>
            ))}
            <button onClick={changePassword} disabled={saving} style={{width:'100%',padding:'14px',background:'linear-gradient(135deg,#0F4C81,#2E86DE)',color:'white',border:'none',borderRadius:'12px',fontSize:'15px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'}}>{saving?'⏳...':'🔒 পাসওয়ার্ড পরিবর্তন করুন'}</button>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddStaff&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'flex-end'}} onClick={()=>setShowAddStaff(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:'white',borderRadius:'24px 24px 0 0',width:'100%',padding:'20px'}}>
            <p style={{margin:'0 0 16px',fontWeight:'800',fontSize:'16px',textAlign:'center',color:'#141D28'}}>নতুন স্টাফ</p>
            {[['পূর্ণ নাম *','fullName','text'],['ফোন নম্বর *','phone','tel'],['পাসওয়ার্ড *','password','password']].map(([l,k,t])=>(
              <div key={k} style={{marginBottom:'12px'}}>
                <label style={{fontSize:'12px',fontWeight:'600',color:'#5E6E8A',display:'block',marginBottom:'5px'}}>{l}</label>
                <input type={t} value={staffForm[k]} onChange={e=>setStaffForm(f=>({...f,[k]:e.target.value}))} style={{width:'100%',padding:'12px',border:'2px solid #E8EDF5',borderRadius:'10px',fontSize:'14px',outline:'none',boxSizing:'border-box',fontFamily:"'Hind Siliguri',sans-serif"}}/>
              </div>
            ))}
            <div style={{marginBottom:'14px'}}>
              <label style={{fontSize:'12px',fontWeight:'600',color:'#5E6E8A',display:'block',marginBottom:'5px'}}>ভূমিকা</label>
              <select value={staffForm.role} onChange={e=>setStaffForm(f=>({...f,role:e.target.value}))} style={{width:'100%',padding:'12px',border:'2px solid #E8EDF5',borderRadius:'10px',fontSize:'14px',outline:'none',fontFamily:"'Hind Siliguri',sans-serif"}}>
                <option value="cashier">ক্যাশিয়ার</option>
                <option value="manager">ম্যানেজার</option>
                <option value="stock_manager">স্টক ম্যানেজার</option>
                <option value="viewer">শুধু দেখতে পারবে</option>
              </select>
            </div>
            <div style={{display:'flex',gap:'10px'}}>
              <button onClick={()=>setShowAddStaff(false)} style={{flex:1,padding:'13px',border:'2px solid #DDE4EE',borderRadius:'12px',background:'white',fontWeight:'600',cursor:'pointer',color:'#5E6E8A',fontFamily:'inherit'}}>বাতিল</button>
              <button onClick={addStaff} disabled={saving} style={{flex:2,padding:'13px',background:'linear-gradient(135deg,#0BAA69,#059669)',color:'white',border:'none',borderRadius:'12px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'}}>{saving?'⏳...':'✅ স্টাফ যোগ করুন'}</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
