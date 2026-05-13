import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Shield, AlertTriangle, Zap, Activity } from 'lucide-react';

const MOCK_TIMELINE = [
  { date: 'Jan', total: 120, fraud: 18, safe: 102 },
  { date: 'Feb', total: 180, fraud: 24, safe: 156 },
  { date: 'Mar', total: 140, fraud: 15, safe: 125 },
  { date: 'Apr', total: 220, fraud: 38, safe: 182 },
  { date: 'May', total: 310, fraud: 52, safe: 258 },
  { date: 'Jun', total: 280, fraud: 44, safe: 236 },
  { date: 'Jul', total: 350, fraud: 61, safe: 289 },
];

const FRAUD_TYPES_DATA = [
  { name: 'Transaction', value: 42, color: '#3B82F6' },
  { name: 'Text/News', value: 31, color: '#8B5CF6' },
  { name: 'Document', value: 27, color: '#06B6D4' },
];

const RISK_DATA = [
  { label: 'HIGH', count: 28, color: '#EF4444' },
  { label: 'MEDIUM', count: 45, color: '#F59E0B' },
  { label: 'LOW', count: 177, color: '#10B981' },
];

function KPICard({ icon: Icon, label, value, sub, color, delay }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), delay); }, [delay]);

  return (
    <div className="glass-card" style={{
      padding: '22px', cursor: 'default',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}20`, border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-green)', letterSpacing: 1 }}>▲ LIVE</span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--text-primary)', marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(13,18,28,0.95)', border: '1px solid rgba(59,130,246,0.2)',
      borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(20px)',
    }}>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: 'var(--text-primary)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 12, color: p.color, fontFamily: 'var(--font-mono)' }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage({ cases }) {
  const totalCases = cases.length + 250;
  const fraudCases = cases.filter(c => c.is_fraud).length + 52;
  const safeCases = totalCases - fraudCases;
  const fraudRate = ((fraudCases / totalCases) * 100).toFixed(1);

  const timelineData = MOCK_TIMELINE.map((d, i) =>
    i === MOCK_TIMELINE.length - 1
      ? { ...d, total: d.total + cases.length, fraud: d.fraud + fraudCases - 52 }
      : d
  );

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100vh' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--text-primary)' }}>
          Analytics Dashboard
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Real-time fraud detection metrics and insights
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KPICard icon={Activity} label="Total Analyzed" value={totalCases.toLocaleString()} sub="All time submissions" color="#3B82F6" delay={0} />
        <KPICard icon={AlertTriangle} label="Fraud Detected" value={fraudCases} sub={`${fraudRate}% fraud rate`} color="#EF4444" delay={100} />
        <KPICard icon={Shield} label="Cases Safe" value={safeCases} sub="Verified clean" color="#10B981" delay={200} />
        <KPICard icon={Zap} label="Avg Response" value="247ms" sub="Sub-second analysis" color="#F59E0B" delay={300} />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Timeline */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                Detection Timeline
              </h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Monthly fraud vs safe cases</p>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              {[{ color: '#EF4444', label: 'Fraud' }, { color: '#3B82F6', label: 'Safe' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timelineData}>
              <defs>
                <linearGradient id="gFraud" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gSafe" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="safe" name="Safe" stroke="#3B82F6" strokeWidth={2} fill="url(#gSafe)" />
              <Area type="monotone" dataKey="fraud" name="Fraud" stroke="#EF4444" strokeWidth={2} fill="url(#gFraud)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
            Fraud by Type
          </h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>Distribution breakdown</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={FRAUD_TYPES_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {FRAUD_TYPES_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v}%`, 'Share']} contentStyle={{ background: 'rgba(13,18,28,0.95)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FRAUD_TYPES_DATA.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{d.name}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: d.color }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Risk levels */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
            Risk Distribution
          </h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>Cases by risk level</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {RISK_DATA.map(r => {
              const pct = (r.count / (RISK_DATA.reduce((a, b) => a + b.count, 0))) * 100;
              return (
                <div key={r.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: r.color, letterSpacing: 1 }}>{r.label} RISK</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{r.count} cases</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      background: `linear-gradient(90deg, ${r.color}80, ${r.color})`,
                      width: `${pct}%`,
                      boxShadow: `0 0 10px ${r.color}60`,
                      transition: 'width 1s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Model performance */}
        <div className="glass-card" style={{ padding: '22px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
            Model Performance
          </h3>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>Accuracy by model type</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={[
              { model: 'XGBoost', accuracy: 93.2 },
              { model: 'BERT', accuracy: 88.7 },
              { model: 'EfficientNet', accuracy: 91.4 },
              { model: 'Ensemble', accuracy: 96.1 },
            ]} barSize={28}>
              <XAxis dataKey="model" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[80, 100]} tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="accuracy" name="Accuracy %" radius={[6, 6, 0, 0]}>
                {['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981'].map((color, i) => (
                  <Cell key={i} fill={color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
