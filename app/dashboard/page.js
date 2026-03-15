"use client";
import { useState, useEffect, useCallback } from "react";
import { T } from "@/lib/design";
import { Card, Badge, Spinner, EmptyState } from "@/lib/ui";
import { SvgIcon } from "@/lib/icons";
import { taka, greeting, fmtDate } from "@/lib/helpers";

export default function DashboardPage({ user, setActive }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = useCallback(async () => {
    if (!user?.shopId) { setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/dashboard?shopId=${user.shopId}`);
      const d   = await res.json();
      if (d.success) setData(d.data);
      else setError(d.error || "লোড ব্যর্থ");
    } catch { setError("সার্ভার সমস্যা"); }
    setLoading(false);
  }, [user?.shopId]);

  useEffect(() => { load(); }, [load]);

  // ড্যাশবোর্ডে ফিরে আসলে auto-refresh
  useEffect(() => {
    const handler = () => load();
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, [load]);

  const maxChart = Math.max(...(data?.chartData || []).map(d => d.sales), 1);
  const maxProfit = Math.max(...(data?.chartData || []).map(d => d.profit), 1);

  const stats = [
    { label: "আজকের বিক্রয়", value: taka(data?.todayTotal  || 0), color: T.brand,   icon: "cart",     bg: `${T.brand}12` },
    { label: "আজকের লাভ",    value: taka(data?.todayProfit || 0), color: T.success, icon: "trending",  bg: `${T.success}12` },
    { label: "মোট বাকি",     value: taka(data?.totalDue    || 0), color: T.warning, icon: "alert",     bg: `${T.warning}12` },
    { label: "মোট পণ্য",     value: data?.totalProducts    || 0,  color: T.info,    icon: "box",       bg: `${T.info}12` },
  ];

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}><Spinner /></div>;

  return (
    <div style={{ padding: "16px 16px 0" }}>

      {/* গ্রিটিং */}
      <div style={{ background: T.brandGrad, borderRadius: T.radiusLg, padding: "18px 20px", marginBottom: 16, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ fontSize: 13, opacity: .85, marginBottom: 2 }}>{greeting()} 👋</div>
        <div style={{ fontWeight: 800, fontSize: 18 }}>{user?.name}</div>
        <div style={{ fontSize: 12, opacity: .75, marginTop: 2 }}>{user?.shopName}</div>
        <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", opacity: .15, fontSize: 60 }}>🛒</div>
        {/* রিফ্রেশ বাটন */}
        <button onClick={load} style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: "6px 10px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          🔄 আপডেট
        </button>
      </div>

      {error && (
        <div style={{ background: "#FEE2E2", borderRadius: T.radius, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: T.danger }}>
          ⚠️ {error} — <button onClick={load} style={{ background: "none", border: "none", color: T.brand, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>আবার চেষ্টা</button>
        </div>
      )}

      {/* স্ট্যাটস গ্রিড */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {stats.map((s, i) => (
          <Card key={i} style={{ padding: "14px 12px" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
              <SvgIcon icon={s.icon} size={18} color={s.color} />
            </div>
            <div style={{ fontWeight: 800, fontSize: 18, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* আজকের সারসংক্ষেপ */}
      {(data?.todayOrders > 0 || data?.todayDue > 0) && (
        <Card style={{ marginBottom: 16, background: `${T.brand}06`, border: `1px solid ${T.brand}20` }}>
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 10, color: T.brand }}>📊 আজকের সারসংক্ষেপ</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { l: "অর্ডার", v: `${data?.todayOrders || 0}টি`,   c: T.info },
              { l: "বিক্রয়", v: taka(data?.todayTotal  || 0),   c: T.brand },
              { l: "আজ বাকি", v: taka(data?.todayDue    || 0),   c: T.warning },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center", padding: "8px 4px", background: T.surface, borderRadius: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <button onClick={() => setActive("pos")} style={{ padding: "14px", borderRadius: T.radius, background: T.brandGrad, border: "none", cursor: "pointer", color: "#fff", fontWeight: 700, fontSize: 13, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <SvgIcon icon="pos" size={16} color="#fff" />নতুন বিক্রয়
        </button>
        <button onClick={() => setActive("inventory")} style={{ padding: "14px", borderRadius: T.radius, background: `${T.info}12`, border: `1px solid ${T.info}30`, cursor: "pointer", color: T.info, fontWeight: 700, fontSize: 13, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <SvgIcon icon="plus" size={16} color={T.info} />পণ্য যোগ
        </button>
      </div>

      {/* বিক্রয় ও লাভ চার্ট */}
      {data?.chartData?.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>📈 মাসিক বিক্রয় ও লাভ</div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 10, color: T.brand, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, background: T.brand, borderRadius: 3, display: "inline-block" }} /> বিক্রয়
            </span>
            <span style={{ fontSize: 10, color: T.success, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, background: T.success, borderRadius: 3, display: "inline-block" }} /> লাভ
            </span>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80 }}>
            {data.chartData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{ width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 1, height: 70 }}>
                  <div style={{ width: "45%", background: T.brandGrad, borderRadius: "3px 3px 0 0", height: Math.max(3, Math.round((d.sales / maxChart) * 68)), transition: "height 0.4s" }} />
                  <div style={{ width: "45%", background: T.success, borderRadius: "3px 3px 0 0", height: Math.max(2, Math.round((Math.max(0, d.profit) / Math.max(maxProfit, 1)) * 60)), transition: "height 0.4s", opacity: 0.8 }} />
                </div>
                <div style={{ fontSize: 8, color: T.textMuted }}>{d.month}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* লো স্টক সতর্কতা */}
      {data?.lowStockItems?.length > 0 && (
        <Card style={{ marginBottom: 16, border: `1.5px solid ${T.warning}40` }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: T.warning, marginBottom: 10 }}>
            ⚠️ লো স্টক সতর্কতা ({data.lowStockItems.length}টি পণ্য)
          </div>
          {data.lowStockItems.slice(0, 4).map(p => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
              <Badge color="warning">{p.stock} {p.unit} বাকি</Badge>
            </div>
          ))}
          {data.lowStockItems.length > 4 && (
            <div style={{ fontSize: 12, color: T.textMuted, textAlign: "center", marginTop: 8 }}>
              আরও {data.lowStockItems.length - 4}টি পণ্য লো স্টকে
            </div>
          )}
        </Card>
      )}

      {/* সাম্প্রতিক বিক্রয় */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>🧾 সাম্প্রতিক বিক্রয়</div>
        {!data?.recentSales?.length
          ? <EmptyState icon="🧾" title="কোনো বিক্রয় নেই" sub="POS থেকে বিক্রয় শুরু করুন" />
          : data.recentSales.map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{s.customers?.name || "সাধারণ গ্রাহক"}</div>
                <div style={{ fontSize: 11, color: T.textMuted }}>{s.invoice_id} · {fmtDate(s.created_at)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, color: T.brand }}>{taka(s.total)}</div>
                {(+s.due) > 0
                  ? <div style={{ fontSize: 11, color: T.warning, fontWeight: 700 }}>বাকি {taka(s.due)}</div>
                  : <Badge color="success">পরিশোধ</Badge>
                }
              </div>
            </div>
          ))
        }
      </Card>

    </div>
  );
}
