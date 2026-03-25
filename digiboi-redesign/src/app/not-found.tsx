import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg)', padding: 24,
    }}>
      <div style={{
        background: 'linear-gradient(145deg,#0b0f1a,#0f1520)',
        border: '1px solid rgba(255,255,255,.06)',
        borderRadius: 16, padding: 32, maxWidth: 400, width: '100%',
        textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,.6)',
      }}>
        <div style={{
          width: 56, height: 56,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          borderRadius: 16, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1.6rem',
          margin: '0 auto 16px',
          boxShadow: '0 8px 24px rgba(99,102,241,.4)',
        }}>📦</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#6366f1', marginBottom: 8 }}>
          404
        </div>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#e8edf5', marginBottom: 8 }}>
          Page Not Found
        </h2>
        <p style={{ color: '#8892a4', fontSize: '.82rem', marginBottom: 24, lineHeight: 1.6 }}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: '#fff', textDecoration: 'none', borderRadius: 9,
          padding: '10px 24px', fontWeight: 600, fontSize: '.84rem',
          fontFamily: 'Outfit,sans-serif',
        }}>
          🏠 Back to Digiboi
        </Link>
      </div>
    </div>
  )
}
