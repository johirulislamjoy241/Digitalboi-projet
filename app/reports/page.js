"use client";
import { useState, useEffect } from "react";
import { T } from '@/lib/design';
import { Card, Badge, ProgressBar, Btn, Spinner } from '@/lib/ui';
import { SvgIcon } from '@/lib/icons';
import { taka } from '@/lib/helpers';

function TopBar({ title, onBack }) {
  return (
    <div style={{ background:T.surface,padding:"14px 16px",display:"flex",alignItems:"center",gap:12,borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:50 }}>
      {onBack&&<button onClick={onBack} style={{ background:`${T.brand}12`,border:"none",borderRadius:10,padding:"8px",cursor:"pointer",color:T.brand,display:"flex" }}><SvgIcon icon="back" size={18}/></button>}
      <h1 style={{ margin:0,fontSize:17,fontWeight:800,color:T.text }}>{title}</h1>
    </div>
  );
}

export default function ReportsPage({ onBack, user }) {
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    if(!user?.shopId){ setLoading(false); return; }
    fetch(`/api/dashboard?shopId=${user.shopId}`)
      .then(r=>r.json()).then(d=>{ if(d.success) setData(d.data); setLoading(false); })
      .catch(()=>setLoading(false));
  },[user?.shopId]);

  const maxS = data?.chartData ? Math.max(...data.chartData.map(d=>d.sales),1) : 1;

  return (
    <div style={{ paddingBottom:80 }}>
      <TopBar title="রিপোর্ট ও বিশ্লেষণ" onBack={onBack}/>
      {loading ? <div style={{ padding:40,textAlign:"center" }}><Spinner/></div> : (
        <div style={{ padding:16 }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16 }}>
            {[
              {l:"এই মাসের বিক্রয়",v:taka(data?.monthTotal||0),c:T.brand},
              {l:"আজকের বিক্রয়",v:taka(data?.todayTotal||0),c:T.success},
              {l:"মোট বাকি",v:taka(data?.totalDue||0),c:T.warning},
              {l:"আজকের অর্ডার",v:data?.todayOrders||0,c:T.info},
            ].map((s,i)=>(
              <Card key={i} style={{ textAlign:"center",padding:"16px 10px" }}>
                <div style={{ fontSize:20,fontWeight:800,color:s.c }}>{s.v}</div>
                <div style={{ fontSize:11,color:T.textMuted,marginTop:4 }}>{s.l}</div>
              </Card>
            ))}
          </div>

          {data?.chartData&&(
            <Card style={{ marginBottom:16 }}>
              <div style={{ fontWeight:800,fontSize:14,marginBottom:14 }}>📈 মাসিক বিক্রয়</div>
              {data.chartData.map((d,i)=>(
                <div key={i} style={{ display:"flex",alignItems:"center",gap:12,marginBottom:10 }}>
                  <div style={{ width:32,fontSize:11,color:T.textMuted,fontWeight:600 }}>{d.month}</div>
                  <div style={{ flex:1 }}>
                    <ProgressBar value={d.sales} max={maxS} color={T.brand}/>
                    <div style={{ fontSize:10,color:T.textMuted,marginTop:2 }}>{taka(d.sales)}</div>
                  </div>
                  <div style={{ fontSize:12,fontWeight:700,color:T.success,minWidth:55,textAlign:"right" }}>{taka(d.profit)}</div>
                </div>
              ))}
            </Card>
          )}

          <Card>
            <div style={{ fontWeight:800,fontSize:14,marginBottom:12 }}>📥 রিপোর্ট ডাউনলোড</div>
            {[{l:"দৈনিক রিপোর্ট",t:"PDF",c:T.danger},{l:"মাসিক রিপোর্ট",t:"Excel",c:T.success},{l:"ইনভেন্টরি রিপোর্ট",t:"PDF",c:T.info},{l:"কাস্টমার রিপোর্ট",t:"Excel",c:T.purple}].map((r,i)=>(
              <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${T.border}` }}>
                <div style={{ fontSize:13,fontWeight:600 }}>{r.l}</div>
                <Btn variant="secondary" size="sm" style={{ color:r.c }}><SvgIcon icon="download" size={14}/>{r.t}</Btn>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
