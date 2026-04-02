'use client'
import { Home, Package, ScanLine, BookOpen, BarChart2 } from 'lucide-react'
import { useAppStore, type ActiveSection } from '@/lib/app-store'
import { useToast } from '@/lib/toast-context'

const NAV_ITEMS = [
  { id: 'dashboard' as ActiveSection, icon: Home,      label: 'হোম' },
  { id: 'inventory' as ActiveSection, icon: Package,   label: 'পণ্য' },
  { id: 'scan'      as ActiveSection, icon: ScanLine,  label: 'স্ক্যান', isScan: true },
  { id: 'dueledger' as ActiveSection, icon: BookOpen,  label: 'বকেয়া' },
  { id: 'reports'   as ActiveSection, icon: BarChart2, label: 'রিপোর্ট' },
]

export default function BottomNav() {
  const { activeSection, setActiveSection } = useAppStore()
  const { toast } = useToast()

  function nav(id: ActiveSection, isScan?: boolean) {
    if (isScan) { toast('QR স্ক্যানার শীঘ্রই আসছে 📷', 'in'); return }
    setActiveSection(id)
  }

  return (
    <nav className="bottom-nav" aria-label="মোবাইল নেভিগেশন">
      {NAV_ITEMS.map(item => {
        const Icon = item.icon
        const isActive = activeSection === item.id && !item.isScan

        if (item.isScan) {
          return (
            <div key={item.id} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flex:1 }}>
              <button className="nav-scan-btn" onClick={() => nav(item.id, true)} aria-label="QR স্ক্যান">
                <Icon size={22} strokeWidth={2.5} />
              </button>
              <span className="nav-item-label" style={{ color:'var(--text3)', fontSize:'0.56rem' }}>{item.label}</span>
            </div>
          )
        }

        return (
          <button
            key={item.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => nav(item.id)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="nav-item-icon">
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="nav-item-label">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
