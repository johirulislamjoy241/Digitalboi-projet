// ── Phone helpers ──
export function normalizePhone(phone) {
  if (!phone) return null;
  const d = phone.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("0")) return "+88" + d;
  if (d.length === 13 && d.startsWith("880")) return "+" + d;
  if (d.length === 14 && d.startsWith("8801")) return "+" + d.slice(1);
  return null;
}

export function validateBDPhone(phone) {
  const n = normalizePhone(phone);
  return !!n && /^\+8801[3-9]\d{8}$/.test(n);
}

// ── Invoice ID ── race-condition safe
export function generateInvoiceId() {
  const now  = new Date();
  const date = now.toISOString().slice(0,10).replace(/-/g,"");
  const ms   = (now.getTime() % 100000).toString().padStart(5,"0");
  const rand = Math.floor(Math.random()*1000).toString().padStart(3,"0");
  return `INV-${date}-${ms}${rand}`;
}

// ── Currency ──
export function taka(amount) {
  const n = parseFloat(amount) || 0;
  return "৳" + n.toLocaleString("bn-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Bengali numbers ──
export function bnNum(n) {
  return String(n).replace(/[0-9]/g, d => "০১২৩৪৫৬৭৮৯"[d]);
}

// ── Password strength ──
export function passwordStrength(p) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 6)  s++;
  if (p.length >= 10) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

export const strengthColors = ["#EF4444","#F59E0B","#F59E0B","#10B981","#10B981"];
export const strengthLabels = ["","খুব দুর্বল","দুর্বল","মাঝারি","শক্তিশালী","অতি শক্তিশালী"];

// ── Greeting ──
export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "শুভ সকাল";
  if (h < 17) return "শুভ দুপুর";
  if (h < 20) return "শুভ বিকাল";
  return "শুভ সন্ধ্যা";
}

// ── Date format ──
export function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("bn-BD", { day:"2-digit", month:"short", year:"numeric" });
}

export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "এইমাত্র";
  if (m < 60) return `${m} মিনিট আগে`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ঘণ্টা আগে`;
  const day = Math.floor(h / 24);
  return `${day} দিন আগে`;
}
