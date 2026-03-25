export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem',
          margin: '0 auto 16px',
          boxShadow: '0 8px 24px rgba(99,102,241,.4)',
        }}>📦</div>
        <div style={{
          width: 24, height: 24,
          border: '2px solid rgba(255,255,255,.1)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin .7s linear infinite',
          margin: '0 auto',
        }} />
        <p style={{ color: '#8892a4', fontSize: '.82rem', marginTop: 12 }}>
          Loading Digiboi...
        </p>
      </div>
    </div>
  )
}
