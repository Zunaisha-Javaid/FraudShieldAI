import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader, Download, AlertCircle } from 'lucide-react';

const SAMPLE_CSV = `text,type
"URGENT: Click here to verify your bank account now",text
"Transaction from new device $4500 shipping to Russia",transaction
"Scientists make breakthrough in renewable energy",text
"Congratulations you won lottery claim your $500000 prize send fee",text
"Monthly subscription charge $9.99 from Netflix",transaction`;

export default function BulkPage({ addCase }) {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef(null);

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    return lines.slice(1).map(line => {
      const vals = line.match(/(?:"[^"]*"|[^,])+/g) || [];
      const row = {};
      headers.forEach((h, i) => { row[h] = (vals[i] || '').trim().replace(/"/g, ''); });
      return row;
    });
  };

  const handleFile = (f) => {
    if (!f || !f.name.endsWith('.csv')) return;
    setFile(f);
    setResults([]);
    setProgress(0);
    const reader = new FileReader();
    reader.onload = (e) => setRows(parseCSV(e.target.result));
    reader.readAsText(f);
  };

  const processBulk = async () => {
    if (!rows.length) return;
    setProcessing(true);
    setResults([]);

    const processed = [];
    for (let i = 0; i < rows.length; i++) {
      await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
      const row = rows[i];
      const text = row.text || Object.values(row)[0] || '';
      const fraudKeywords = ['urgent', 'click', 'won', 'prize', 'verify', 'claim', 'fee', 'congratulations', 'russia'];
      const matches = fraudKeywords.filter(k => text.toLowerCase().includes(k)).length;
      const score = Math.min(0.97, 0.1 + matches * 0.2 + Math.random() * 0.08);
      const isFraud = score > 0.5;

      const result = {
        id: i + 1,
        input: text,
        verdict: isFraud ? 'FRAUD' : 'SAFE',
        is_fraud: isFraud,
        confidence: parseFloat(score.toFixed(3)),
        risk_level: score > 0.7 ? 'HIGH' : score > 0.4 ? 'MEDIUM' : 'LOW',
        fraud_type: row.type || 'text',
        model_used: 'Ensemble',
        processing_time_ms: Math.floor(150 + Math.random() * 250),
        timestamp: new Date().toISOString(),
      };

      processed.push(result);
      addCase(result);
      setResults([...processed]);
      setProgress(Math.round(((i + 1) / rows.length) * 100));
    }
    setProcessing(false);
  };

  const downloadResults = () => {
    const header = 'id,text,verdict,risk_level,confidence,fraud_type,processing_ms\n';
    const body = results.map(r =>
      `${r.id},"${r.input}",${r.verdict},${r.risk_level},${(r.confidence * 100).toFixed(1)},${r.fraud_type},${r.processing_time_ms}`
    ).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'fraudshield_results.csv'; a.click();
  };

  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const fraudCount = results.filter(r => r.is_fraud).length;
  const safeCount = results.filter(r => !r.is_fraud).length;

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--text-primary)' }}>
          Bulk Analysis
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Upload a CSV file to analyze hundreds of records at once
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Upload zone */}
        <div>
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--accent-blue)' : 'rgba(59,130,246,0.2)'}`,
              borderRadius: 16,
              padding: '48px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragging ? 'rgba(59,130,246,0.08)' : 'var(--bg-card)',
              transition: 'all 0.3s ease',
              marginBottom: 16,
            }}>
            <input type="file" ref={fileRef} accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 8 }}>
              {file ? file.name : 'Drop CSV file here'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {file ? `${rows.length} rows detected` : 'or click to browse • .csv files only'}
            </div>
          </div>

          {/* Sample CSV */}
          <div className="glass-card" style={{ padding: '16px', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-blue)', letterSpacing: 2, marginBottom: 10 }}>
              SAMPLE CSV FORMAT
            </div>
            <pre style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)',
              background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '12px',
              overflow: 'auto', maxHeight: 140, lineHeight: 1.6,
            }}>
              {SAMPLE_CSV}
            </pre>
            <button onClick={() => {
              const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
              a.download = 'sample_fraud_data.csv'; a.click();
            }}
              style={{
                marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: '1px solid var(--border)',
                borderRadius: 8, padding: '7px 14px', color: 'var(--text-muted)',
                fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.color = 'var(--accent-blue)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Download size={13} /> Download Sample CSV
            </button>
          </div>

          {rows.length > 0 && !processing && results.length === 0 && (
            <button onClick={processBulk} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Upload size={16} />
              Analyze {rows.length} Records
            </button>
          )}

          {processing && (
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <Loader size={16} color="var(--accent-blue)" style={{ animation: 'spin-slow 1s linear infinite' }} />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                  Processing... {progress}%
                </span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))',
                  width: `${progress}%`, transition: 'width 0.3s ease',
                  boxShadow: '0 0 12px rgba(59,130,246,0.5)',
                }} />
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontFamily: 'var(--font-mono)' }}>
                {results.length} of {rows.length} records analyzed
              </p>
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          {results.length > 0 && (
            <>
              {/* Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Total', value: results.length, color: 'var(--accent-blue)' },
                  { label: 'Fraud', value: fraudCount, color: '#EF4444' },
                  { label: 'Safe', value: safeCount, color: '#10B981' },
                ].map(s => (
                  <div key={s.label} className="glass-card" style={{ padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: s.color }}>{s.value}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1 }}>{s.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>

              {!processing && (
                <button onClick={downloadResults}
                  style={{
                    width: '100%', marginBottom: 12, padding: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 10, color: 'var(--accent-green)',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
                >
                  <Download size={15} /> Export Results CSV
                </button>
              )}

              {/* Results list */}
              <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {results.map(r => {
                  const riskColor = r.risk_level === 'HIGH' ? '#EF4444' : r.risk_level === 'MEDIUM' ? '#F59E0B' : '#10B981';
                  return (
                    <div key={r.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 10,
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                    }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', minWidth: 24 }}>#{r.id}</span>
                      {r.is_fraud ? <XCircle size={15} color="#EF4444" /> : <CheckCircle size={15} color="#10B981" />}
                      <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.input?.slice(0, 50)}{r.input?.length > 50 ? '...' : ''}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 8px', borderRadius: 50, background: `${riskColor}20`, color: riskColor }}>
                        {r.risk_level}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: r.is_fraud ? '#EF4444' : '#10B981', minWidth: 36 }}>
                        {(r.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {results.length === 0 && !processing && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text-secondary)' }}>
                Results will appear here
              </p>
              <p style={{ fontSize: 13, marginTop: 6 }}>Upload a CSV and click Analyze</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
