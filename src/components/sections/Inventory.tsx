'use client'
import { useEffect, useState, useMemo } from 'react'
import { useAppStore } from '@/lib/app-store'
import { useApi } from '@/lib/api'
import { useToast } from '@/lib/toast-context'
import { formatCurrency, UNITS, CATEGORIES } from '@/lib/utils'
import type { InventoryItem } from '@/types'
import { Search, Plus, Edit2, Trash2, Archive, ChevronLeft, ChevronRight, QrCode, RefreshCw, X, Package } from 'lucide-react'

type SK = 'name' | 'category' | 'quantity' | 'buy_price' | 'sell_price'
const CE: Record<string,string> = { Electronics:'⚡',Clothing:'👕','Food & Beverage':'🍎',Furniture:'🪑',Books:'📚',Stationery:'✏️',Medicine:'💊',Cosmetics:'💄',Hardware:'🔧',Toys:'🎮',Sports:'⚽',Automotive:'🚗',Agriculture:'🌾',General:'📦' }

function StatusBadge({ s }:{ s:string }) {
  if (s==='In Stock') return <span className="badge badge-success">✓ আছে</span>
  if (s==='Low Stock') return <span className="badge badge-warning">⚠ কম</span>
  if (s==='Out of Stock') return <span className="badge badge-danger">✕ শেষ</span>
  return <span className="badge badge-neutral">📦 আর্কাইভ</span>
}

function genCode(name:string) {
  const t = Date.now().toString(36).toUpperCase()
  const p = name.replace(/[^A-Za-z]/g,'').substring(0,3).toUpperCase()||'DGB'
  return `DGB-${p}-${t}`
}

function QRSvg({ val, sz=130 }:{ val:string; sz?:number }) {
  const n=21, cs=sz/n
  const grid = Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>{
    if(r<7&&c<7) return r===0||r===6||c===0||c===6||(r>=2&&r<=4&&c>=2&&c<=4)
    if(r<7&&c>=n-7){const lc=c-(n-7);return r===0||r===6||lc===0||lc===6||(r>=2&&r<=4&&lc>=2&&lc<=4)}
    if(r>=n-7&&c<7){const lr=r-(n-7);return lr===0||lr===6||c===0||c===6||(lr>=2&&lr<=4&&c>=2&&c<=4)}
    return ((val.charCodeAt((r*n+c)%val.length)+r*7+c*13)%3)!==0
  }))
  return (
    <div style={{display:'inline-flex',flexDirection:'column',alignItems:'center',background:'white',padding:8,borderRadius:10,border:'1px solid var(--border)'}}>
      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
        {grid.map((row,r)=>row.map((cell,c)=>cell?<rect key={`${r}${c}`} x={c*cs} y={r*cs} width={cs} height={cs} fill="#000"/>:null))}
      </svg>
      <div style={{fontSize:'0.55rem',fontFamily:'monospace',color:'#444',marginTop:4,wordBreak:'break-all',textAlign:'center',maxWidth:sz,userSelect:'all'}}>{val}</div>
    </div>
  )
}

function Barcode({ val }:{ val:string }) {
  return (
    <div style={{textAlign:'center',padding:'8px 10px',background:'white',borderRadius:8,border:'1px solid var(--border)',width:'100%'}}>
      <div style={{display:'flex',justifyContent:'center',gap:1,height:40,marginBottom:3}}>
        {val.split('').map((ch,i)=>{
          const w=[2,1,3,1,2,1,3,2,1,2][(ch.charCodeAt(0)+i)%10]
          return <div key={i} style={{width:w*2,background:'#000',height:'100%',borderRadius:1}}/>
        })}
      </div>
      <div style={{fontSize:'0.55rem',fontFamily:'monospace',color:'#444',userSelect:'all'}}>{val}</div>
    </div>
  )
}

function QRSheet({ item, fmt, onClose }:{ item:InventoryItem; fmt:(v:number)=>string; onClose:()=>void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-qr" onClick={e=>e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-handle"/>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:7}}>
              <QrCode size={16} color="var(--brand-1)"/>
              <span className="modal-title">পণ্যের QR তথ্য</span>
            </div>
            <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',padding:4}}><X size={18}/></button>
          </div>
        </div>
        <div className="modal-body">
          <div style={{display:'flex',justifyContent:'center',marginBottom:12}}>
            <QRSvg val={item.product_link||item.id}/>
          </div>
          <div style={{background:'var(--surface2)',borderRadius:12,padding:12,display:'flex',flexDirection:'column',gap:9,marginBottom:12}}>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <div style={{width:40,height:40,borderRadius:10,background:'var(--brand-subtle)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',flexShrink:0}}>{CE[item.category]||'📦'}</div>
              <div>
                <div style={{fontWeight:700,fontSize:'0.9rem',color:'var(--text)',fontFamily:'var(--font-bn)'}}>{item.name}</div>
                <div style={{fontSize:'0.7rem',color:'var(--text3)',fontFamily:'var(--font-bn)'}}>📂 {item.category}</div>
              </div>
            </div>
            {item.notes&&<div style={{background:'var(--surface)',borderRadius:8,padding:'7px 10px',fontSize:'0.75rem',color:'var(--text2)',fontFamily:'var(--font-bn)',lineHeight:1.5}}>📝 {item.notes}</div>}
            <div style={{background:'var(--success-light)',borderRadius:9,padding:'9px 12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:'0.75rem',color:'var(--text2)',fontFamily:'var(--font-bn)'}}>💰 বিক্রয় মূল্য</span>
              <span style={{fontFamily:'var(--font-mono)',fontWeight:800,fontSize:'1rem',color:'var(--success)'}}>{fmt(item.sell_price)}</span>
            </div>
            <div style={{display:'flex',alignItems:'flex-start',gap:9,background:'linear-gradient(135deg,var(--brand-subtle),rgba(255,152,0,0.07))',border:'1.5px solid var(--brand-glow)',borderRadius:10,padding:'10px 12px'}}>
              <Package size={15} color="var(--brand-1)" style={{flexShrink:0,marginTop:2}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'0.75rem',fontWeight:700,color:'var(--brand-1)',fontFamily:'var(--font-bn)',marginBottom:3}}>ডিজিবই তালিকাভুক্ত পণ্য</div>
                <div style={{fontSize:'0.65rem',color:'var(--text3)',fontFamily:'var(--font-bn)',marginBottom:3}}>Digiboi ডিজিটাল সিস্টেমে নিবন্ধিত</div>
                <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--text2)',background:'var(--surface)',borderRadius:5,padding:'3px 7px',wordBreak:'break-all',userSelect:'all'}}>🔑 {item.product_link||item.id}</div>
              </div>
            </div>
          </div>
          <div style={{fontSize:'0.68rem',color:'var(--text3)',fontFamily:'var(--font-bn)',marginBottom:5,textAlign:'center'}}>বারকোড</div>
          <Barcode val={item.product_link||item.id}/>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-full" onClick={onClose}>বন্ধ করুন</button>
        </div>
      </div>
    </div>
  )
}

export default function InventorySection() {
  const { inventory, setInventory, currency } = useAppStore()
  const api = useApi()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 20
  const [sortKey, setSortKey] = useState<SK>('name')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [modal, setModal] = useState<'add'|'edit'|'qr'|null>(null)
  const [editItem, setEditItem] = useState<InventoryItem|null>(null)
  const [qrItem, setQrItem] = useState<InventoryItem|null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name:'', category:'General', quantity:'', unit:'pcs', buy_price:'', sell_price:'', notes:'', image_url:'', status:'In Stock', barcode:'' })
  const fmt = (v:number) => formatCurrency(v,currency)

  async function load() {
    setLoading(true)
    const d = await api.getInventory()
    setInventory(d)
    setLoading(false)
  }
  useEffect(()=>{ load() },[]) // eslint-disable-line

  const filtered = useMemo(()=>{
    let r = inventory
    if (search) r=r.filter(i=>i.name.toLowerCase().includes(search.toLowerCase())||i.category.toLowerCase().includes(search.toLowerCase()))
    if (statusFilter) r=r.filter(i=>i.status===statusFilter)
    return [...r].sort((a,b)=>{
      const va=a[sortKey] as string|number, vb=b[sortKey] as string|number
      return sortDir==='asc'?(va>vb?1:-1):(va<vb?1:-1)
    })
  },[inventory,search,statusFilter,sortKey,sortDir])

  const paginated = filtered.slice((page-1)*perPage, page*perPage)
  const totalPages = Math.ceil(filtered.length/perPage)
  const ppu = form.buy_price&&form.sell_price ? parseFloat(form.sell_price)-parseFloat(form.buy_price) : null
  const pm = ppu!==null&&parseFloat(form.buy_price)>0 ? ((ppu/parseFloat(form.buy_price))*100).toFixed(1) : null
  const tv = form.quantity&&form.buy_price ? parseFloat(form.quantity)*parseFloat(form.buy_price) : null

  function openAdd() {
    setEditItem(null)
    setForm({ name:'', category:'General', quantity:'', unit:'pcs', buy_price:'', sell_price:'', notes:'', image_url:'', status:'In Stock', barcode:'' })
    setModal('add')
  }
  function openEdit(item:InventoryItem) {
    setEditItem(item)
    setForm({ name:item.name, category:item.category, quantity:String(item.quantity), unit:item.unit, buy_price:String(item.buy_price), sell_price:String(item.sell_price), notes:item.notes||'', image_url:item.image_url||'', status:item.status, barcode:item.product_link||'' })
    setModal('edit')
  }
  function autoCode() {
    const c = genCode(form.name||'PRD')
    setForm(f=>({...f,barcode:c}))
    toast('বারকোড তৈরি হয়েছে ✅','ok')
  }
  async function save() {
    if (!form.name.trim()) return toast('পণ্যের নাম দিন','er')
    const bp=parseFloat(form.buy_price), sp=parseFloat(form.sell_price), qty=parseFloat(form.quantity)
    if (isNaN(bp)||bp<0) return toast('সঠিক ক্রয় মূল্য দিন','er')
    if (isNaN(sp)||sp<0) return toast('সঠিক বিক্রয় মূল্য দিন','er')
    if (modal==='add'&&(isNaN(qty)||qty<0)) return toast('সঠিক পরিমাণ দিন','er')
    setSaving(true)
    try {
      const payload = { name:form.name.trim(), category:form.category, unit:form.unit, buy_price:bp, sell_price:sp, notes:form.notes, image_url:form.image_url, product_link:form.barcode, ...(modal==='add'?{quantity:qty}:{status:form.status as InventoryItem['status']}) }
      if (modal==='edit'&&editItem) {
        const u=await api.updateProduct(editItem.id,payload)
        setInventory(inventory.map(i=>i.id===editItem.id?{...i,...u}:i))
        toast('পণ্য আপডেট হয়েছে ✅','ok')
      } else {
        const c=await api.addProduct(payload)
        setInventory([c,...inventory])
        toast('পণ্য যোগ হয়েছে ✅','ok')
      }
      setModal(null)
    } catch(e:unknown){toast((e as Error).message||'সমস্যা','er')}
    setSaving(false)
  }
  async function del(item:InventoryItem) {
    if (!confirm(`"${item.name}" মুছে ফেলবেন?`)) return
    try { await api.deleteProduct(item.id); setInventory(inventory.filter(i=>i.id!==item.id)); toast('মুছে ফেলা হয়েছে','wa') }
    catch(e:unknown){toast((e as Error).message||'সমস্যা','er')}
  }
  async function archive(item:InventoryItem) {
    const ns=item.status==='Archived'?'In Stock':'Archived'
    try { const u=await api.updateProduct(item.id,{status:ns}); setInventory(inventory.map(i=>i.id===item.id?{...i,...u}:i)); toast(ns==='Archived'?'আর্কাইভ হয়েছে':'পুনরুদ্ধার হয়েছে','in') }
    catch{/**/}
  }

  const SF=['','In Stock','Low Stock','Out of Stock','Archived']
  const SL:Record<string,string>={'':'সব','In Stock':'✓ স্টক','Low Stock':'⚠ কম','Out of Stock':'✕ শেষ','Archived':'📦 আর্কাইভ'}
  const stats = useMemo(()=>{
    const a=inventory.filter(i=>i.status!=='Archived')
    return { total:a.length, value:a.reduce((s,i)=>s+i.quantity*i.buy_price,0), low:a.filter(i=>i.status==='Low Stock'||i.status==='Out of Stock').length }
  },[inventory])

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}} className="anim-fade-up">
        {[
          {label:'মোট পণ্য',value:stats.total,color:'var(--info)',bg:'var(--info-light)'},
          {label:'স্টক মূল্য',value:fmt(stats.value),color:'var(--brand-1)',bg:'var(--brand-subtle)',mono:true},
          {label:'সতর্কতা',value:stats.low,color:stats.low>0?'var(--danger)':'var(--success)',bg:stats.low>0?'var(--danger-light)':'var(--success-light)'},
        ].map((s,i)=>(
          <div key={i} style={{background:s.bg,borderRadius:12,padding:'10px 8px',textAlign:'center'}}>
            <div style={{fontFamily:s.mono?'var(--font-mono)':'var(--font-bn)',fontWeight:700,fontSize:'0.8rem',color:s.color,wordBreak:'break-all'}}>{s.value}</div>
            <div style={{fontSize:'0.6rem',color:'var(--text3)',fontFamily:'var(--font-bn)',marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Header + Search */}
      <div className="card card-p anim-fade-up anim-d1">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div>
            <div className="section-title">ইনভেন্টরি</div>
            <div className="section-subtitle">{filtered.length} টি পণ্য</div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={load}><RefreshCw size={15} className={loading?'spin':''}/></button>
            <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={16}/> যোগ</button>
          </div>
        </div>
        <div className="search-bar" style={{marginBottom:10}}>
          <Search size={15} color="var(--text3)"/>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="পণ্যের নাম বা ক্যাটাগরি খুঁজুন..."/>
          {search&&<button onClick={()=>setSearch('')} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',padding:0}}>✕</button>}
        </div>
        <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:2,scrollbarWidth:'none'}}>
          {SF.map(s=>(
            <button key={s} className={`chip ${statusFilter===s?'active':''}`} style={{flexShrink:0}} onClick={()=>{setStatusFilter(s);setPage(1)}}>{SL[s]}</button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading&&[1,2,3].map(i=>(
        <div key={i} className="card card-p" style={{display:'flex',gap:12,alignItems:'center'}}>
          <div className="skeleton" style={{width:52,height:52,borderRadius:12,flexShrink:0}}/>
          <div style={{flex:1}}>
            <div className="skeleton" style={{height:13,marginBottom:8,borderRadius:6}}/>
            <div className="skeleton" style={{height:10,width:'55%',borderRadius:6}}/>
          </div>
        </div>
      ))}

      {/* Empty */}
      {!loading&&paginated.length===0&&(
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">কোনো পণ্য পাওয়া যায়নি</div>
            <div className="empty-sub">নতুন পণ্য যোগ করুন</div>
            <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={14}/> নতুন পণ্য</button>
          </div>
        </div>
      )}

      {/* List */}
      {!loading&&paginated.map((item,idx)=>(
        <div key={item.id} className="product-card anim-fade-up" style={{animationDelay:`${idx*0.03}s`}}>
          <div className="product-img">
            {item.image_url?<img src={item.image_url} alt={item.name} onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>:<span>{CE[item.category]||'📦'}</span>}
          </div>
          <div className="product-info">
            <div className="product-name">{item.name}</div>
            <div className="product-category">{item.category} · {item.quantity} {item.unit}</div>
            <div style={{marginTop:5,display:'flex',gap:5,alignItems:'center',flexWrap:'wrap'}}>
              <StatusBadge s={item.status}/>
              <span style={{fontSize:'0.62rem',color:'var(--text3)',fontFamily:'var(--font-bn)'}}>লাভ: {fmt(item.sell_price-item.buy_price)}/একক</span>
            </div>
          </div>
          <div className="product-meta">
            <div className="product-price">{fmt(item.sell_price)}</div>
            <div className="text-xs text-muted mono">ক্রয়: {fmt(item.buy_price)}</div>
            <div style={{display:'flex',gap:5,marginTop:6,flexWrap:'wrap',justifyContent:'flex-end'}}>
              {item.product_link&&<button className="btn btn-xs btn-ghost" style={{padding:'4px 6px'}} onClick={()=>{setQrItem(item);setModal('qr')}}><QrCode size={12}/></button>}
              <button className="btn btn-xs btn-ghost" style={{padding:'4px 8px'}} onClick={()=>openEdit(item)}><Edit2 size={12}/></button>
              <button className="btn btn-xs btn-ghost" style={{padding:'4px 8px'}} onClick={()=>archive(item)}><Archive size={12}/></button>
              <button className="btn btn-xs btn-danger" style={{padding:'4px 8px'}} onClick={()=>del(item)}><Trash2 size={12}/></button>
            </div>
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages>1&&(
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'8px 0'}}>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}><ChevronLeft size={16}/></button>
          <span className="text-sm text-muted">{page}/{totalPages} ({filtered.length} পণ্য)</span>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}><ChevronRight size={16}/></button>
        </div>
      )}

      {/* ══ ADD/EDIT MODAL ══ */}
      {(modal==='add'||modal==='edit')&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>

            {/* Header */}
            <div className="modal-header">
              <div className="modal-handle"/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span className="modal-title">{modal==='add'?'➕ নতুন পণ্য যোগ':'✏️ পণ্য সম্পাদনা'}</span>
                <button onClick={()=>setModal(null)} style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',padding:4,borderRadius:8}}><X size={20}/></button>
              </div>
            </div>

            {/* Body */}
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">পণ্যের নাম *</label>
                <input className="input" placeholder="যেমন: নাপা এক্সটেন্ড" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} autoFocus/>
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">ক্যাটাগরি</label>
                  <select className="input" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                    {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">একক</label>
                  <select className="input" value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}>
                    {UNITS.map(u=><option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              {modal==='add'&&(
                <div className="input-group">
                  <label className="input-label">প্রারম্ভিক পরিমাণ</label>
                  <input className="input" type="number" placeholder="0" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))} min="0" step="any"/>
                </div>
              )}
              <div className="grid-2">
                <div className="input-group">
                  <label className="input-label">ক্রয় মূল্য *</label>
                  <input className="input" type="number" placeholder="0.00" value={form.buy_price} onChange={e=>setForm(f=>({...f,buy_price:e.target.value}))} min="0" step="any"/>
                </div>
                <div className="input-group">
                  <label className="input-label">বিক্রয় মূল্য *</label>
                  <input className="input" type="number" placeholder="0.00" value={form.sell_price} onChange={e=>setForm(f=>({...f,sell_price:e.target.value}))} min="0" step="any"/>
                </div>
              </div>
              {ppu!==null&&(
                <div style={{background:ppu>=0?'var(--success-light)':'var(--danger-light)',borderRadius:10,padding:'9px 12px',marginBottom:14,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:'var(--font-mono)',fontWeight:700,fontSize:'0.82rem',color:ppu>=0?'var(--success)':'var(--danger)'}}>{ppu>=0?'+':''}{fmt(ppu)}</div>
                    <div style={{fontSize:'0.58rem',color:'var(--text3)',fontFamily:'var(--font-bn)'}}>লাভ/একক</div>
                  </div>
                  <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:'var(--font-mono)',fontWeight:700,fontSize:'0.82rem',color:ppu>=0?'var(--success)':'var(--danger)'}}>{pm}%</div>
                    <div style={{fontSize:'0.58rem',color:'var(--text3)',fontFamily:'var(--font-bn)'}}>মার্জিন</div>
                  </div>
                  {tv!==null&&(
                    <div style={{textAlign:'center'}}>
                      <div style={{fontFamily:'var(--font-mono)',fontWeight:700,fontSize:'0.82rem',color:'var(--text)'}}>{fmt(tv)}</div>
                      <div style={{fontSize:'0.58rem',color:'var(--text3)',fontFamily:'var(--font-bn)'}}>মোট মূল্য</div>
                    </div>
                  )}
                </div>
              )}
              {modal==='edit'&&(
                <div className="input-group">
                  <label className="input-label">স্ট্যাটাস</label>
                  <select className="input" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                    <option value="In Stock">স্টক আছে</option>
                    <option value="Low Stock">কম স্টক</option>
                    <option value="Out of Stock">স্টক শেষ</option>
                    <option value="Archived">আর্কাইভ</option>
                  </select>
                </div>
              )}
              <div className="input-group">
                <label className="input-label" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{display:'flex',alignItems:'center',gap:5}}><QrCode size={13}/> QR / বারকোড</span>
                  <button type="button" className="btn btn-xs btn-ghost" onClick={autoCode}>⚡ অটো তৈরি</button>
                </label>
                <input className="input" placeholder="স্ক্যান করুন বা লিখুন" value={form.barcode} onChange={e=>setForm(f=>({...f,barcode:e.target.value}))}/>
                {form.barcode&&(
                  <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:8,alignItems:'center'}}>
                    <QRSvg val={form.barcode} sz={110}/>
                    <Barcode val={form.barcode}/>
                  </div>
                )}
              </div>
              <div className="input-group">
                <label className="input-label">ছবির লিংক (ঐচ্ছিক)</label>
                <input className="input" placeholder="https://..." value={form.image_url} onChange={e=>setForm(f=>({...f,image_url:e.target.value}))}/>
              </div>
              <div className="input-group" style={{marginBottom:0}}>
                <label className="input-label">বিবরণ / নোট (ঐচ্ছিক)</label>
                <input className="input" placeholder="পণ্য সম্পর্কে তথ্য..." value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
              </div>
            </div>

            {/* Footer — always visible */}
            <div className="modal-footer">
              <button className="btn btn-ghost" style={{flex:1}} onClick={()=>setModal(null)}>বাতিল</button>
              <button className="btn btn-primary" style={{flex:2}} onClick={save} disabled={saving}>
                {saving
                  ? <span style={{display:'inline-flex',alignItems:'center',gap:7}}><span className="spin" style={{width:14,height:14,border:'2px solid rgba(255,255,255,0.4)',borderTopColor:'white',borderRadius:'50%',display:'inline-block'}}/>সংরক্ষণ...</span>
                  : modal==='add'?'✅ পণ্য যোগ করুন':'💾 পরিবর্তন সংরক্ষণ'
                }
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══ QR SHEET ══ */}
      {modal==='qr'&&qrItem&&<QRSheet item={qrItem} fmt={fmt} onClose={()=>setModal(null)}/>}

    </div>
  )
}
