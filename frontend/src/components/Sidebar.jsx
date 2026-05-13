import React from 'react';
import { Shield, MessageSquare, LayoutDashboard, History, Upload, Zap } from 'lucide-react';

const navItems = [
  { id: 'chat', icon: MessageSquare, label: 'Analyze', sub: 'Chat Interface' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', sub: 'Analytics' },
  { id: 'history', icon: History, label: 'History', sub: 'Case Log' },
  { id: 'bulk', icon: Upload, label: 'Bulk Scan', sub: 'CSV Upload' },
];

export default function Sidebar({ activePage, setPage }) {
  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, width: 260,
      background: 'rgba(10,14,26,0.95)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(59,130,246,0.12)',
      display: 'flex', flexDirection: 'column',
      padding: '24px 16px',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '0 8px 32px', borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(59,130,246,0.4)',
            animation: 'pulse-glow 3s ease-in-out infinite',
          }}>
            <Shield size={22} color="white" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>
              FraudShield
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-blue)', letterSpacing: 2 }}>
              AI v1.0
            </div>
          </div>
        </div>
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent-green)',
            boxShadow: '0 0 8px var(--accent-green)',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-green)' }}>
            SYSTEM ONLINE
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {navItems.map(({ id, icon: Icon, label, sub }) => {
          const active = activePage === id;
          return (
            <button key={id} onClick={() => setPage(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px',
                borderRadius: 12,
                border: active ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                background: active
                  ? 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))'
                  : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(59,130,246,0.07)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.15)'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}}
            >
              {active && (
                <div style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: 3, borderRadius: '0 3px 3px 0',
                  background: 'linear-gradient(180deg, var(--accent-blue), var(--accent-purple))',
                  boxShadow: '0 0 10px var(--accent-blue)',
                }} />
              )}
              <div style={{
                width: 36, height: 36,
                borderRadius: 10,
                background: active ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' : 'rgba(59,130,246,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}>
                <Icon size={17} color={active ? 'white' : 'var(--accent-blue)'} />
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{sub}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom status */}
      <div style={{
        padding: '16px 14px',
        background: 'rgba(59,130,246,0.06)',
        borderRadius: 12,
        border: '1px solid rgba(59,130,246,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Zap size={14} color="var(--accent-orange)" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>
            Models Active
          </span>
        </div>
        {['XGBoost v2.1', 'BERT-Fraud', 'EfficientNet-B4'].map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 6px var(--accent-green)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{m}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
