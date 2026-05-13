import React, { useEffect, useRef, useState } from 'react';
import { Shield, Zap, Eye, Brain, ChevronRight, Activity } from 'lucide-react';

const STATS = [
  { value: '99.2%', label: 'Detection Accuracy' },
  { value: '<200ms', label: 'Response Time' },
  { value: '3', label: 'Fraud Models' },
  { value: '500K+', label: 'Transactions Analyzed' },
];

const FEATURES = [
  { icon: Brain, color: '#3B82F6', label: 'ML-Powered', desc: 'XGBoost + BERT + EfficientNet ensemble' },
  { icon: Eye, color: '#8B5CF6', label: 'Multi-Modal', desc: 'Text, images & transaction data' },
  { icon: Activity, color: '#10B981', label: 'Real-Time', desc: 'Streaming WebSocket responses' },
  { icon: Zap, color: '#F59E0B', label: 'Explainable', desc: 'SHAP-powered decision insights' },
];

function FloatingParticle({ style }) {
  return (
    <div style={{
      position: 'absolute',
      width: 2,
      height: 2,
      borderRadius: '50%',
      background: 'rgba(59,130,246,0.6)',
      animation: 'float 4s ease-in-out infinite',
      ...style,
    }} />
  );
}

function CountUp({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const isNum = !isNaN(parseFloat(target));

  useEffect(() => {
    if (!isNum) return;
    const end = parseFloat(target);
    const duration = 1800;
    const step = end / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(current * 10) / 10);
    }, 16);
    return () => clearInterval(timer);
  }, [target, isNum]);

  if (!isNum) return <span>{target}</span>;
  return <span>{count}{suffix}</span>;
}

export default function LandingPage({ onEnter }) {
  const [visible, setVisible] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    const t = setInterval(() => setScanning(s => !s), 3000);
    return () => clearInterval(t);
  }, []);

  const particles = Array.from({ length: 20 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 4}s`,
    animationDuration: `${3 + Math.random() * 4}s`,
  }));

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', padding: '40px 24px',
    }}>
      {/* Background grid */}
      <div className="grid-bg" />

      {/* Floating particles */}
      {particles.map((p, i) => <FloatingParticle key={i} style={p} />)}

      {/* Radial glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* HERO */}
      <div style={{
        textAlign: 'center', maxWidth: 820,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative', zIndex: 1,
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 50, padding: '6px 18px', marginBottom: 32,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 8px var(--accent-green)', animation: 'pulse-glow 2s infinite' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-blue)', letterSpacing: 2 }}>
            AI-POWERED FRAUD DETECTION
          </span>
        </div>

        {/* Shield logo */}
        <div style={{
          width: 100, height: 100,
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          borderRadius: 28, margin: '0 auto 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 60px rgba(59,130,246,0.5), 0 0 120px rgba(139,92,246,0.2)',
          animation: 'float 4s ease-in-out infinite',
        }}>
          <Shield size={50} color="white" />
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 800,
          fontSize: 72, lineHeight: 1.05, marginBottom: 8,
        }}>
          <span className="gradient-text">FraudShield</span>
          <span style={{ color: 'var(--text-primary)' }}> AI</span>
        </h1>

        <p style={{
          fontFamily: 'var(--font-display)', fontWeight: 500,
          fontSize: 20, color: 'var(--text-secondary)', marginBottom: 20, letterSpacing: 0.5,
        }}>
          Multi-Modal Intelligent Fraud Detection
        </p>

        <p style={{
          color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.8,
          maxWidth: 560, margin: '0 auto 48px',
        }}>
          Detect financial fraud, fake news, and document forgery in real-time using
          an ensemble of specialized AI models — powered by XGBoost, BERT, and EfficientNet.
        </p>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 64 }}>
          <button onClick={onEnter} className="btn-primary"
            style={{ padding: '14px 36px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
            Start Analyzing
            <ChevronRight size={18} />
          </button>
          <button style={{
            background: 'transparent',
            border: '1px solid var(--border-hover)',
            color: 'var(--text-secondary)',
            padding: '14px 36px', borderRadius: 50,
            fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15,
            cursor: 'pointer', transition: 'all 0.3s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            View Demo
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 64,
        }}>
          {STATS.map((s, i) => (
            <div key={i} className="glass-card" style={{ padding: '20px 12px', textAlign: 'center',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: `all 0.6s ease ${0.2 + i * 0.1}s`,
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: 'var(--accent-blue)', marginBottom: 4 }}>
                {visible ? <CountUp target={s.value} /> : '0'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>
                {s.label.toUpperCase()}
              </div>
            </div>
          ))}
        </div>

        {/* Feature pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {FEATURES.map(({ icon: Icon, color, label, desc }, i) => (
            <div key={i} className="glass-card" style={{
              padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: `all 0.6s ease ${0.4 + i * 0.1}s`,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: `${color}1A`, border: `1px solid ${color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
