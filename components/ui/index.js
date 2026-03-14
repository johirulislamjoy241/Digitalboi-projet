'use client';

/* ═══════════════════════════════════════════════════════
   DIGIBOI v3 UI DESIGN SYSTEM
   Brand: #FF5722 (Orange)  |  All components here
═══════════════════════════════════════════════════════ */

// ── SVG ICONS ─────────────────────────────────────────
export const ICONS = {
  home:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg>,
  pos:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  box:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
  users:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  chart:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  menu:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  bell:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
  back:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  plus:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>,
  x:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  check:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>,
  scan:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>,
  qr:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="3" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="14" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="3" y="16" width="3" height="3" fill="currentColor" stroke="none"/><path d="M14 14h3v3M17 17h3v3M14 20h3"/></svg>,
  trash:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>,
  edit:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg>,
  map:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  phone:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>,
  logout:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  warn:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  print:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  gift:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>,
  download:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  settings:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/></svg>,
  eye:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeoff:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  store:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  globe:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  cam:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  key:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  nid:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="12" r="3"/><path d="M14 10h4M14 14h4"/></svg>,
  star:    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  ai:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  shield:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  id:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  tag:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  truck:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  refresh: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  dollar:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  list:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
};

export const Icon = ({ name, size = 20, color = 'currentColor' }) => (
  <span style={{ display:'inline-flex', alignItems:'center', width:size, height:size, color, flexShrink:0 }}>
    {ICONS[name]}
  </span>
);

// ── CARD ───────────────────────────────────────────────
export const Card = ({ children, style = {}, onClick, className = '' }) => (
  <div
    className={className}
    onClick={onClick}
    style={{
      background: 'var(--surface)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow)',
      padding: 16,
      ...style,
    }}
  >
    {children}
  </div>
);

// ── BUTTON ─────────────────────────────────────────────
export const Btn = ({
  children, variant = 'primary', size = 'md', full = false,
  onClick, disabled = false, style = {}, type = 'button'
}) => {
  const base = {
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700, display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 6, transition: 'all 0.18s',
    opacity: disabled ? 0.5 : 1, width: full ? '100%' : 'auto',
    fontFamily: 'inherit', ...style,
  };
  const sizes = {
    sm: { padding: '6px 14px', fontSize: 12, borderRadius: 8 },
    md: { padding: '11px 20px', fontSize: 14, borderRadius: 10 },
    lg: { padding: '14px 24px', fontSize: 15, borderRadius: 12 },
  };
  const variants = {
    primary:   { background: 'var(--brand-grad)', color: '#fff', boxShadow: '0 4px 14px rgba(255,87,34,0.35)' },
    secondary: { background: '#F0F2F8', color: 'var(--text)' },
    ghost:     { background: 'transparent', color: 'var(--brand)', border: '1.5px solid rgba(255,87,34,0.3)' },
    danger:    { background: 'var(--danger-soft)', color: 'var(--danger)' },
    success:   { background: 'var(--success-soft)', color: 'var(--success)' },
    dark:      { background: 'var(--text)', color: '#fff' },
    warning:   { background: 'var(--warning-soft)', color: 'var(--warning)' },
  };
  return (
    <button
      type={type}
      style={{ ...base, ...sizes[size], ...variants[variant] }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// ── INPUT ──────────────────────────────────────────────
import { useState } from 'react';

export const Input = ({
  label, placeholder, value, onChange, type = 'text',
  icon, error, helper, style = {}, autoFocus, inputMode,
  autoComplete = 'off', readOnly
}) => {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);

  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 6, letterSpacing: 0.3 }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 12, color: focused ? 'var(--brand)' : 'var(--text-muted)', zIndex: 1 }}>
            <Icon name={icon} size={18} />
          </span>
        )}
        <input
          type={type === 'password' ? (showPass ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={value || ''}
          onChange={e => onChange && onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus={autoFocus}
          inputMode={inputMode}
          autoComplete={autoComplete}
          readOnly={readOnly}
          style={{
            width: '100%',
            padding: `12px ${type === 'password' ? '42px' : '14px'} 12px ${icon ? '42px' : '14px'}`,
            border: `1.5px solid ${error ? 'var(--danger)' : focused ? 'var(--brand)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-sm)',
            fontSize: 14,
            background: readOnly ? 'var(--surface-alt)' : 'var(--surface)',
            outline: 'none',
            color: 'var(--text)',
            transition: 'border 0.2s',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
          >
            <Icon name={showPass ? 'eyeoff' : 'eye'} size={18} />
          </button>
        )}
      </div>
      {error && <p style={{ fontSize: 11, color: 'var(--danger)', margin: '4px 0 0', paddingLeft: 2 }}>{error}</p>}
      {helper && !error && <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0', paddingLeft: 2 }}>{helper}</p>}
    </div>
  );
};

// ── SELECT ─────────────────────────────────────────────
export const Select = ({ label, value, onChange, options = [], placeholder = 'নির্বাচন করুন', icon, disabled }) => (
  <div style={{ marginBottom: 14 }}>
    {label && (
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 6 }}>
        {label}
      </label>
    )}
    <div style={{ position: 'relative' }}>
      {icon && (
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }}>
          <Icon name={icon} size={18} />
        </span>
      )}
      <select
        value={value || ''}
        onChange={e => onChange && onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: `12px 32px 12px ${icon ? '42px' : '14px'}`,
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 14,
          background: 'var(--surface)',
          outline: 'none',
          color: value ? 'var(--text)' : 'var(--text-muted)',
          appearance: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(o => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)', fontSize: 10 }}>▼</span>
    </div>
  </div>
);

// ── BADGE ──────────────────────────────────────────────
export const Badge = ({ children, color = 'brand', dot = false }) => {
  const map = {
    brand:   { bg: '#FFF0EB', text: '#FF5722' },
    success: { bg: '#D1FAE5', text: '#10B981' },
    warning: { bg: '#FEF3C7', text: '#F59E0B' },
    danger:  { bg: '#FEE2E2', text: '#EF4444' },
    info:    { bg: '#DBEAFE', text: '#3B82F6' },
    purple:  { bg: '#EDE9FE', text: '#8B5CF6' },
    dark:    { bg: '#E2E4EA', text: '#1A1D2E' },
  };
  const c = map[color] || map.brand;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20,
      background: c.bg, color: c.text,
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.text }} />}
      {children}
    </span>
  );
};

// ── AVATAR ─────────────────────────────────────────────
export const Avatar = ({ name = '?', size = 40, gradient = 'var(--brand-grad)' }) => (
  <div style={{
    width: size, height: size,
    borderRadius: Math.round(size * 0.28),
    background: gradient,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: size * 0.4,
    flexShrink: 0,
  }}>
    {String(name)[0]?.toUpperCase() ?? '?'}
  </div>
);

// ── DIVIDER ────────────────────────────────────────────
export const Divider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    {label && <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{label}</span>}
    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
  </div>
);

// ── PROGRESS BAR ───────────────────────────────────────
export const ProgressBar = ({ value, max, color = 'var(--brand)', height = 6 }) => (
  <div style={{ background: '#F0F2F8', borderRadius: 99, height, overflow: 'hidden' }}>
    <div style={{
      width: `${Math.min(100, (value / Math.max(max, 1)) * 100)}%`,
      height: '100%', background: color, borderRadius: 99,
      transition: 'width 0.5s',
    }} />
  </div>
);

// ── MODAL SHEET ────────────────────────────────────────
export const ModalSheet = ({ visible, onClose, title, children, maxHeight = '90vh' }) => {
  if (!visible) return null;
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="slide-up"
        style={{ background: 'var(--surface)', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 430, maxHeight, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 4, margin: '0 auto' }} />
          {title && <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{title}</h3>}
          <button onClick={onClose} style={{ background: 'var(--danger-soft)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ── EMPTY STATE ────────────────────────────────────────
export const Empty = ({ icon = '📭', title = 'কিছু নেই', sub = '' }) => (
  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
    <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-sub)', marginBottom: 4 }}>{title}</div>
    {sub && <div style={{ fontSize: 13 }}>{sub}</div>}
  </div>
);

// ── SPINNER ────────────────────────────────────────────
export const Spinner = ({ size = 36, color = 'var(--brand)' }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    border: `3px solid var(--border)`,
    borderTopColor: color,
    animation: 'spin 0.7s linear infinite',
  }} />
);

// ── LOADING PAGE ───────────────────────────────────────
export const LoadingPage = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
    <Spinner size={40} />
    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>লোড হচ্ছে...</div>
  </div>
);
