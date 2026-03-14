"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function Page() {
  const router = useRouter();
  useEffect(() => { router.replace("/"); }, [router]);
  return null;
}

export default function ReceiptPage({ params }) {
  const { shop } = useAuthStore();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadSale(); }, []);
  const loadSale = async () => {
    try { const d = await api.get(`/api/sales/${params.id}`); setSale(d); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const fmt = n => `৳${Number(n||0).toLocaleString('bn-BD')}`;
  const statusMap = { completed:['পরিশোধ','#0BAA69'], partial:['আংশিক','#F4A261'], due:['বাকি','#E63946'] };

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',fontFamily:"'Hind Siliguri',sans-serif"}}>⏳ লোড হচ্ছে...</div>;
  if (!sale) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',color:'#E63946',fontFamily:"'Hind Siliguri',sans-serif"}}>রসিদ পাওয়া যায়নি</div>;

  const [statusLabel, statusColor] = statusMap[sale.status] || ['—','#8A9AB5'];

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`@media print{.no-print{display:none!important}body{margin:0}.receipt{box-shadow:none!important;border-radius:0!important;max-width:100%!important}}@page{size:A4;margin:10mm}`}</style>

      <div style={{minHeight:'100vh',background:'#F4F7FB',fontFamily:"'Hind Siliguri',sans-serif",padding:'16px'}}>
        <div className="no-print" style={{display:'flex',gap:'10px',marginBottom:'16px',maxWidth:'500px',margin:'0 auto 16px'}}>
          <Link href="/sales" style={{flex:1,display:'block'}}>
            <button style={{width:'100%',padding:'12px',border:'2px solid #DDE4EE',borderRadius:'12px',background:'white',fontSize:'14px',fontWeight:'600',cursor:'pointer',color:'#5E6E8A',fontFamily:'inherit'}}>← ফিরে যান</button>
          </Link>
          <button onClick={()=>window.print()} style={{flex:2,padding:'12px',background:'linear-gradient(135deg,#0F4C81,#2E86DE)',color:'white',border:'none',borderRadius:'12px',fontSize:'14px',fontWeight:'700',cursor:'pointer',fontFamily:'inherit'}}>🖨️ প্রিন্ট করুন</button>
        </div>

        <div className="receipt" style={{background:'white',maxWidth:'500px',margin:'0 auto',borderRadius:'20px',boxShadow:'0 8px 32px rgba(15,40,80,0.12)',overflow:'hidden'}}>
          {/* Header */}
          <div style={{background:'linear-gradient(135deg,#0F4C81,#2E86DE)',padding:'24px 20px',textAlign:'center',color:'white'}}>
            <div style={{width:'56px',height:'56px',background:'rgba(255,255,255,0.2)',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 10px'}}>
              <span style={{fontWeight:'800',fontSize:'26px',fontFamily:"'Syne',sans-serif"}}>D</span>
            </div>
            <h2 style={{margin:0,fontSize:'20px',fontWeight:'800'}}>{shop?.shop_name||'Digiboi Shop'}</h2>
            {shop?.address&&<p style={{margin:'4px 0 0',fontSize:'12px',opacity:0.8}}>📍 {shop.address}</p>}
            {shop?.phone&&<p style={{margin:'2px 0 0',fontSize:'12px',opacity:0.8}}>📞 {shop.phone}</p>}
          </div>

          {/* Invoice Info */}
          <div style={{padding:'16px 20px',background:'#F8FAFC',borderBottom:'1px solid #EEF2F7'}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <div><p style={{margin:0,fontSize:'11px',color:'#8A9AB5'}}>চালান নম্বর</p><p style={{margin:'2px 0 0',fontWeight:'800',fontSize:'15px',color:'#141D28'}}>#{sale.invoice_number}</p></div>
              <div style={{textAlign:'right'}}><p style={{margin:0,fontSize:'11px',color:'#8A9AB5'}}>তারিখ</p><p style={{margin:'2px 0 0',fontWeight:'700',fontSize:'12px',color:'#141D28'}}>{new Date(sale.created_at).toLocaleDateString('bn-BD',{day:'numeric',month:'long',year:'numeric'})}</p></div>
            </div>
            {sale.customers&&<div style={{marginTop:'10px',padding:'10px',background:'white',borderRadius:'10px',border:'1px solid #EEF2F7'}}>
              <p style={{margin:0,fontSize:'11px',color:'#8A9AB5'}}>গ্রাহক</p>
              <p style={{margin:'2px 0 0',fontWeight:'700',color:'#141D28'}}>{sale.customers.name}</p>
              {sale.customers.phone&&<p style={{margin:'1px 0 0',fontSize:'12px',color:'#5E6E8A'}}>📞 {sale.customers.phone}</p>}
            </div>}
          </div>

          {/* Items */}
          <div style={{padding:'16px 20px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 50px 70px 80px',gap:'6px',marginBottom:'8px',paddingBottom:'8px',borderBottom:'1px solid #EEF2F7'}}>
              {['পণ্য','পরি.','একক','মোট'].map(h=><span key={h} style={{fontSize:'11px',fontWeight:'700',color:'#8A9AB5'}}>{h}</span>)}
            </div>
            {sale.sale_items?.map(item=>(
              <div key={item.id} style={{display:'grid',gridTemplateColumns:'1fr 50px 70px 80px',gap:'6px',padding:'8px 0',borderBottom:'1px solid #F8FAFC',alignItems:'center'}}>
                <span style={{fontSize:'13px',fontWeight:'600',color:'#141D28',lineHeight:1.3}}>{item.product_name}</span>
                <span style={{fontSize:'13px',color:'#5E6E8A',textAlign:'center'}}>{item.quantity}</span>
                <span style={{fontSize:'12px',color:'#5E6E8A'}}>{fmt(item.unit_price)}</span>
                <span style={{fontSize:'13px',fontWeight:'700',color:'#141D28',textAlign:'right'}}>{fmt(item.subtotal)}</span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div style={{padding:'14px 20px',background:'#F8FAFC',borderTop:'1px solid #EEF2F7'}}>
            {[[`উপমোট`,fmt(sale.subtotal),'#141D28'],
              Number(sale.discount)>0?[`ছাড়`,`-${fmt(sale.discount)}`,'#0BAA69']:null,
              [`পরিশোধ`,fmt(sale.paid_amount),'#0BAA69'],
              Number(sale.due_amount)>0?[`বাকি`,fmt(sale.due_amount),'#E63946']:null,
            ].filter(Boolean).map(([l,v,c])=>(
              <div key={l} style={{display:'flex',justifyContent:'space-between',marginBottom:'6px'}}>
                <span style={{color:'#5E6E8A',fontSize:'13px'}}>{l}</span>
                <span style={{fontWeight:'600',fontSize:'13px',color:c}}>{v}</span>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderTop:'2px solid #DDE4EE',marginTop:'6px'}}>
              <span style={{fontWeight:'800',fontSize:'16px',color:'#141D28'}}>সর্বমোট</span>
              <span style={{fontWeight:'800',fontSize:'20px',color:'#0F4C81'}}>{fmt(sale.total)}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'8px'}}>
              <span style={{fontSize:'12px',color:'#5E6E8A'}}>💳 {sale.payment_method}</span>
              <span style={{padding:'4px 12px',borderRadius:'20px',fontWeight:'700',fontSize:'11px',background:statusColor+'20',color:statusColor}}>{statusLabel}</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{padding:'16px 20px',textAlign:'center',borderTop:'2px dashed #EEF2F7'}}>
            <p style={{margin:0,fontSize:'14px',color:'#0F4C81',fontWeight:'700'}}>ধন্যবাদ! আবার আসবেন 🙏</p>
            <p style={{margin:'4px 0 0',fontSize:'11px',color:'#8A9AB5'}}>Powered by Digiboi • digiboi.app</p>
          </div>
        </div>
      </div>
    </>
  );
}
