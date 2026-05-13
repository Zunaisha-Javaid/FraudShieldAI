import React, { useState } from 'react';
import { Search, Filter, CheckCircle, XCircle, Clock, ChevronDown } from 'lucide-react';

const DEMO_CASES = [
  { id: 1, input: 'URGENT: Your account is compromised click here to verify', verdict: 'FRAUD', risk_level: 'HIGH', confidence: 0.94, fraud_type: 'text', timestamp: '2025-05-08T10:23:00Z', model_used: 'BERT-Fraud-v2', processing_time_ms: 212 },
  { id: 2, input: 'Transaction #4521 from IP 192.168.1.1 for $2,400.00', verdict: 'FRAUD', risk_level: 'HIGH', confidence: 0.88, fraud_type: 'transaction', timestamp: '2025-05-08T09:15:00Z', model_used: 'XGBoost-Ensemble', processing_time_ms: 145 },
  { id: 3, input: 'Scientists discover renewable energy breakthrough at MIT', verdict: 'SAFE', risk_level: 'LOW', confidence: 0.09, fraud_type: 'text', timestamp: '2025-05-07T16:42:00Z', model_used: 'BERT-Fraud-v2', processing_time_ms: 198 },
  { id: 4, input: 'Congratulations you have won $1,000,000 send fee to claim', verdict: 'FRAUD', risk_level: 'HIGH', confidence: 0.97, fraud_type: 'text', timestamp: '2025-05-07T14:11:00Z', model_used: 'BERT-Fraud-v2', processing_time_ms: 167 },
  { id: 5, input: 'Invoice_2025_Q2.pdf - document verification', verdict: 'SAFE', risk_level: 'LOW', confidence: 0.12, fraud_type: 'image', timestamp: '2025-05-06T11:30:00Z', model_used: 'EfficientNet-B4', processing_time_ms: 334 },
  { id: 6, input: 'Transaction #9871 from new device for $450.00', verdict: 'SAFE', risk_level: 'MEDIUM', confidence: 0.41, fraud_type: 'transaction', timestamp: '2025-05-06T09:05:00Z', model_used: 'XGBoost-Ensemble', processing_time_ms: 122 },
];

function CaseRow({ c, isExpanded, onToggle }) {
  const isFraud = c.verdict === 'FRAUD';
  const riskColor = c.risk_level === 'HIGH' ? '#EF4444' : c.risk_level === 'MEDIUM' ? '#F59E0B' : '#10B981';

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 12,
      marginBottom: 8,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div onClick={onToggle} style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr 100px 100px 80px 80px 36px',
        alignItems: 'center', gap: 12,
        padding: '14px 16px',
        background: 'var(--bg-card)',
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
      >
        <div>
          {isFraud
            ? <XCircle size={20} color="#EF4444" />
            : <CheckCircle size={20} color="#10B981" />}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.input?.length > 65 ? c.input.slice(0, 65) + '...' : c.input}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
            {new Date(c.timestamp).toLocaleString()} • {c.model_used}
          </div>
        </div>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, padding: '3px 10px', borderRadius: 50, background: `${riskColor}20`, color: riskColor, border: `1px solid ${riskColor}40` }}>
            {c.risk_level}
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          {c.fraud_type}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: isFraud ? '#EF4444' : '#10B981' }}>
          {(c.confidence * 100).toFixed(0)}%
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} color="var(--text-muted)" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{c.processing_time_ms}ms</span>
        </div>
        <ChevronDown size={16} color="var(--text-muted)" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
      </div>

      {isExpanded && (
        <div style={{ padding: '16px', background: 'rgba(59,130,246,0.03)', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-blue)', letterSpacing: 2, marginBottom: 8 }}>FULL INPUT</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic' }}>"{c.input}"</p>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>Model: {c.model_used}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>Confidence: {(c.confidence * 100).toFixed(1)}%</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>Type: {c.fraud_type}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage({ cases }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  const allCases = [...cases, ...DEMO_CASES].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const filtered = allCases.filter(c => {
    const matchSearch = !search || c.input?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.verdict?.toLowerCase() === filter || c.risk_level?.toLowerCase() === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--text-primary)' }}>
          Case History
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          All analyzed cases with full audit trail
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="input-field"
            placeholder="Search cases..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'fraud', 'safe', 'high', 'medium', 'low'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 12,
                fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 1,
                border: filter === f ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
                background: filter === f ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: filter === f ? 'var(--accent-blue)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '36px 1fr 100px 100px 80px 80px 36px',
        gap: 12, padding: '8px 16px', marginBottom: 8,
      }}>
        {['', 'Input / Details', 'Risk', 'Type', 'Score', 'Time', ''].map((h, i) => (
          <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>{h.toUpperCase()}</div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>No cases found</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your search or filters</p>
        </div>
      ) : (
        filtered.map(c => (
          <CaseRow key={c.id} c={c}
            isExpanded={expanded === c.id}
            onToggle={() => setExpanded(expanded === c.id ? null : c.id)}
          />
        ))
      )}
    </div>
  );
}
