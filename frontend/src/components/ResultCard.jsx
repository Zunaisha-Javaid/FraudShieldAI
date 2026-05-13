import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp, Clock, Cpu, BarChart2 } from 'lucide-react';

function ConfidenceGauge({ value }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(value * 100), 200);
    return () => clearTimeout(t);
  }, [value]);

  const color = value > 0.7 ? '#EF4444' : value > 0.4 ? '#F59E0B' : '#10B981';
  const circumference = 2 * Math.PI * 45;
  const strokeDash = (animated / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: 110, height: 110, margin: '0 auto' }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <circle cx="55" cy="55" r="45" fill="none" stroke={color}
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeDashoffset={circumference * 0.25}
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)', filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color }}>{animated.toFixed(0)}%</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>CONFIDENCE</span>
      </div>
    </div>
  );
}

function FeatureBar({ feature, importance, direction, delay }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(importance * 100), 300 + delay);
    return () => clearTimeout(t);
  }, [importance, delay]);

  const color = direction === 'positive' ? '#EF4444' : '#10B981';
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{feature}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color }}>{(importance * 100).toFixed(0)}%</span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3,
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          width: `${width}%`,
          transition: `width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
          boxShadow: `0 0 8px ${color}60`,
        }} />
      </div>
    </div>
  );
}

export default function ResultCard({ result }) {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 50); }, []);

  if (!result) return null;

  const isFraud = result.is_fraud;
  const riskColor = result.risk_level === 'HIGH' ? '#EF4444' : result.risk_level === 'MEDIUM' ? '#F59E0B' : '#10B981';
  const verdictIcon = isFraud
    ? <XCircle size={24} color="#EF4444" />
    : <CheckCircle size={24} color="#10B981" />;

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(15px) scale(0.98)',
      transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      width: '100%', maxWidth: 620,
    }}>
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        {/* Top verdict banner */}
        <div style={{
          background: isFraud
            ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))'
            : 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))',
          borderBottom: `1px solid ${isFraud ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            padding: 8, borderRadius: 10,
            background: isFraud ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
            boxShadow: isFraud ? '0 0 20px rgba(239,68,68,0.3)' : '0 0 20px rgba(16,185,129,0.3)',
          }}>
            {verdictIcon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20,
              color: isFraud ? '#EF4444' : '#10B981',
              textShadow: isFraud ? '0 0 20px rgba(239,68,68,0.5)' : '0 0 20px rgba(16,185,129,0.5)',
            }}>
              {result.verdict === 'FRAUD' ? '🚨 FRAUD DETECTED' : '✅ CONTENT SAFE'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Analyzed by {result.model_used} • {result.processing_time_ms}ms
            </div>
          </div>
          <div style={{
            padding: '4px 12px', borderRadius: 50,
            background: `${riskColor}20`, border: `1px solid ${riskColor}50`,
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
            color: riskColor, letterSpacing: 1,
          }}>
            {result.risk_level} RISK
          </div>
        </div>

        {/* Main content */}
        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 140px', gap: 20 }}>
          {/* Explanation */}
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-blue)', letterSpacing: 2, marginBottom: 10 }}>
              ANALYSIS SUMMARY
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {result.explanation}
            </p>

            {/* Meta info */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Cpu size={13} color="var(--text-muted)" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                  {result.fraud_type?.toUpperCase()} ANALYSIS
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={13} color="var(--text-muted)" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                  {result.processing_time_ms}ms
                </span>
              </div>
            </div>
          </div>

          {/* Gauge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <ConfidenceGauge value={result.confidence} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 6, letterSpacing: 1 }}>
              FRAUD PROB.
            </div>
          </div>
        </div>

        {/* SHAP Features - expandable */}
        {result.top_features && (
          <div style={{ borderTop: '1px solid var(--border)' }}>
            <button onClick={() => setExpanded(!expanded)}
              style={{
                width: '100%', padding: '12px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-secondary)', transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={14} color="var(--accent-blue)" />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}>
                  SHAP Feature Importance
                </span>
              </div>
              {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
            </button>

            {expanded && (
              <div style={{ padding: '4px 20px 20px' }}>
                {result.top_features.map((f, i) => (
                  <FeatureBar key={i} {...f} delay={i * 80} />
                ))}
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, fontFamily: 'var(--font-mono)' }}>
                  Red bars = fraud indicators • Green bars = safe indicators
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
