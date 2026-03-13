"use client";
import { useState } from "react";
import { T } from "./design";
import { SvgIcon } from "./icons";

export const Card = ({ children, style = {} }) => (
  <div style={{ background: T.surface, borderRadius: T.radius, boxShadow: T.shadow, padding: "16px", ...style }}>
    {children}
  </div>
);

export const Btn = ({ children, variant = "primary", size = "md", full = false, onClick, disabled = false, style = {}, type = "button" }) => {
  const base = {
    border: "none", borderRadius: T.radiusSm, cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
    gap: 6, transition: "all 0.2s", opacity: disabled ? 0.5 : 1,
    width: full ? "100%" : "auto", fontFamily: "inherit", ...style
  };
  const sizes = { sm: { padding: "6px 14px", fontSize: 12 }, md: { padding: "11px 20px", fontSize: 14 }, lg: { padding: "14px 24px", fontSize: 15 } };
  const variants = {
    primary: { background: T.brandGrad, color: "#fff", boxShadow: `0 4px 14px ${T.brand}40` },
    secondary: { background: "#F0F2F8", color: T.text },
    ghost: { background: "transparent", color: T.brand, border: `1.5px solid ${T.brand}30` },
    danger: { background: "#FEE2E2", color: T.danger },
    success: { background: "#D1FAE5", color: T.success },
    dark: { background: T.dark, color: "#fff" },
    warning: { background: "#FEF3C7", color: T.warning },
  };
  return (
    <button type={type} style={{ ...base, ...sizes[size], ...variants[variant] }} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

export const Input = ({ label, placeholder, value, onChange, type = "text", icon, error, helper, style = {}, autoComplete, inputMode, readOnly }) => {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  return (
    <div style={{ marginBottom: 14, ...style }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.textSub, marginBottom: 6, letterSpacing: 0.3 }}>{label}</label>}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        {icon && <span style={{ position: "absolute", left: 12, color: focused ? T.brand : T.textMuted, zIndex: 1 }}><SvgIcon icon={icon} size={18} /></span>}
        <input
          type={type === "password" ? (showPass ? "text" : "password") : type}
          placeholder={placeholder}
          value={value || ""}
          onChange={e => onChange && onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete}
          inputMode={inputMode}
          readOnly={readOnly}
          style={{
            width: "100%",
            padding: `12px ${type === "password" ? "42px" : "14px"} 12px ${icon ? "40px" : "14px"}`,
            border: `1.5px solid ${error ? T.danger : focused ? T.brand : T.border}`,
            borderRadius: T.radiusSm, fontSize: 14, background: readOnly ? T.surfaceAlt : T.surface,
            outline: "none", color: T.text, transition: "border 0.2s",
            boxSizing: "border-box", fontFamily: "inherit",
          }}
        />
        {type === "password" && (
          <button type="button" onClick={() => setShowPass(!showPass)}
            style={{ position: "absolute", right: 12, background: "none", border: "none", cursor: "pointer", color: T.textMuted }}>
            <SvgIcon icon={showPass ? "eyeoff" : "eye"} size={18} />
          </button>
        )}
      </div>
      {error && <p style={{ fontSize: 11, color: T.danger, margin: "4px 0 0", paddingLeft: 2 }}>{error}</p>}
      {helper && !error && <p style={{ fontSize: 11, color: T.textMuted, margin: "4px 0 0", paddingLeft: 2 }}>{helper}</p>}
    </div>
  );
};

export const Select = ({ label, value, onChange, options = [], placeholder = "নির্বাচন করুন", icon }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.textSub, marginBottom: 6 }}>{label}</label>}
    <div style={{ position: "relative" }}>
      {icon && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textMuted, zIndex: 1 }}><SvgIcon icon={icon} size={18} /></span>}
      <select
        value={value || ""}
        onChange={e => onChange && onChange(e.target.value)}
        style={{
          width: "100%", padding: `12px 14px 12px ${icon ? "40px" : "14px"}`,
          border: `1.5px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 14,
          background: T.surface, outline: "none", color: value ? T.text : T.textMuted,
          appearance: "none", fontFamily: "inherit", boxSizing: "border-box", cursor: "pointer",
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(o => { const v = typeof o === "object" ? o.value : o; const l = typeof o === "object" ? o.label : o; return <option key={v} value={v}>{l}</option>; })}
      </select>
      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: T.textMuted, fontSize: 10 }}>▼</span>
    </div>
  </div>
);

export const Badge = ({ children, color = "brand" }) => {
  const colors = {
    brand: { bg: "#FFF0EB", text: T.brand },
    success: { bg: "#D1FAE5", text: T.success },
    warning: { bg: "#FEF3C7", text: T.warning },
    danger: { bg: "#FEE2E2", text: T.danger },
    info: { bg: "#DBEAFE", text: T.info },
    purple: { bg: "#EDE9FE", text: T.purple },
    dark: { bg: "#E2E4EA", text: T.text },
  };
  const c = colors[color] || colors.brand;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, background: c.bg, color: c.text, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
};

export const Avatar = ({ name = "?", size = 40, gradient = T.brandGrad }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.28, background: gradient,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 800, fontSize: size * 0.4, flexShrink: 0, fontFamily: "inherit"
  }}>
    {(name || "?")[0]?.toUpperCase()}
  </div>
);

export const Divider = ({ label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
    <div style={{ flex: 1, height: 1, background: T.border }} />
    {label && <span style={{ fontSize: 12, color: T.textMuted, whiteSpace: "nowrap" }}>{label}</span>}
    <div style={{ flex: 1, height: 1, background: T.border }} />
  </div>
);

export const ProgressBar = ({ value, max, color = T.brand, height = 6 }) => (
  <div style={{ background: "#F0F2F8", borderRadius: 99, height, overflow: "hidden" }}>
    <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.5s" }} />
  </div>
);

export const Spinner = ({ color = T.brand, size = 40 }) => (
  <div style={{
    width: size, height: size, border: `3px solid ${color}30`,
    borderTop: `3px solid ${color}`, borderRadius: "50%",
    animation: "spin 1s linear infinite", margin: "0 auto"
  }} />
);

export const EmptyState = ({ icon = "📭", title, sub }) => (
  <div style={{ textAlign: "center", padding: "40px 20px", color: T.textMuted }}>
    <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>{title}</div>
    {sub && <div style={{ fontSize: 13 }}>{sub}</div>}
  </div>
);
