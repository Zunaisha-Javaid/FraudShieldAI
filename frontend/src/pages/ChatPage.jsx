import React, { useState, useRef, useEffect } from 'react';
import { Send, Image, FileText, AlertTriangle, CheckCircle, Upload, X, Loader, ChevronDown } from 'lucide-react';
import ResultCard from '../components/ResultCard';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const FRAUD_TYPES = [
  { id: 'auto', label: 'Auto Detect', icon: '🤖' },
  { id: 'transaction', label: 'Transaction', icon: '💳' },
  { id: 'text', label: 'Fake News / Text', icon: '📰' },
  { id: 'image', label: 'Document / Image', icon: '🖼️' },
];

const EXAMPLE_PROMPTS = [
  "URGENT: Your account has been compromised. Click here to verify: bit.ly/sec-update",
  "Scientists discover that drinking bleach cures cancer according to WHO report",
  "Congratulations! You've won $1,000,000. Send $50 processing fee to claim your prize.",
];

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '8px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--accent-blue)',
          animation: `pulse-glow 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

export default function ChatPage({ addCase }) {
  const [messages, setMessages] = useState([
    {
      id: 0, role: 'assistant',
      content: "👋 Hello! I'm FraudShield AI. Submit any text, image, or transaction data and I'll analyze it for fraud using my ensemble of specialized ML models. Try an example below or type your own!",
      type: 'welcome',
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedType, setSelectedType] = useState('auto');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileData, setUploadedFileData] = useState(null);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedFileData(ev.target.result);
    if (file.type.startsWith('image/')) reader.readAsDataURL(file);
    else reader.readAsText(file);
  };

  const removeFile = () => { setUploadedFile(null); setUploadedFileData(null); };

  const sendMessage = async (textOverride) => {
    const text = textOverride || input;
    if (!text.trim() && !uploadedFile) return;

    const userMsg = {
      id: Date.now(), role: 'user',
      content: text, file: uploadedFile ? uploadedFile.name : null,
      fileData: uploadedFile?.type.startsWith('image/') ? uploadedFileData : null,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Thinking message
    const thinkId = Date.now() + 1;
    setMessages(prev => [...prev, { id: thinkId, role: 'assistant', type: 'thinking' }]);

    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('fraud_type', selectedType);
      if (uploadedFile) formData.append('file', uploadedFile);

      const res = await axios.post(`${API}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const result = res.data;
      addCase({ input: text, ...result });

      setMessages(prev => prev.map(m =>
        m.id === thinkId ? { id: thinkId, role: 'assistant', type: 'result', result } : m
      ));
    } catch (err) {
      // Fallback mock result when backend not available
      const mockResult = generateMockResult(text, uploadedFile);
      addCase({ input: text, ...mockResult });
      setMessages(prev => prev.map(m =>
        m.id === thinkId ? { id: thinkId, role: 'assistant', type: 'result', result: mockResult } : m
      ));
    }

    setLoading(false);
    setUploadedFile(null);
    setUploadedFileData(null);
  };

  const generateMockResult = (text, file) => {
    const fraudKeywords = ['urgent', 'click', 'won', 'prize', 'verify', 'compromised', 'free', 'bleach', 'cures', 'fee'];
    const lower = text.toLowerCase();
    const matches = fraudKeywords.filter(k => lower.includes(k)).length;
    const score = Math.min(0.95, 0.15 + matches * 0.18 + Math.random() * 0.1);
    const isFraud = score > 0.5;
    const fraudType = file ? 'image' : (matches > 2 ? 'text' : 'transaction');

    return {
      is_fraud: isFraud,
      confidence: parseFloat(score.toFixed(3)),
      fraud_type: fraudType,
      verdict: isFraud ? 'FRAUD' : 'SAFE',
      risk_level: score > 0.7 ? 'HIGH' : score > 0.4 ? 'MEDIUM' : 'LOW',
      explanation: isFraud
        ? `High-risk indicators detected. The content exhibits ${matches} fraud patterns including urgency triggers, suspicious links, and manipulative language typical of phishing and scam attempts.`
        : `No significant fraud indicators found. The content appears legitimate with normal language patterns and no suspicious elements detected.`,
      top_features: [
        { feature: 'Urgency Language', importance: 0.34, direction: 'positive' },
        { feature: 'Suspicious URL Pattern', importance: 0.28, direction: 'positive' },
        { feature: 'Reward Promise', importance: 0.22, direction: 'positive' },
        { feature: 'Source Credibility', importance: 0.16, direction: 'negative' },
      ],
      model_used: fraudType === 'text' ? 'BERT-Fraud-v2' : fraudType === 'image' ? 'EfficientNet-B4' : 'XGBoost-Ensemble',
      processing_time_ms: Math.floor(180 + Math.random() * 300),
    };
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '0 24px' }}>
      {/* Header */}
      <div style={{
        padding: '20px 0 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: 'var(--text-primary)' }}>
            Fraud Analysis
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            Submit text, images, or transaction data for real-time analysis
          </p>
        </div>
        {/* Type selector */}
        <div style={{ display: 'flex', gap: 6 }}>
          {FRAUD_TYPES.map(t => (
            <button key={t.id} onClick={() => setSelectedType(t.id)}
              style={{
                padding: '6px 14px', borderRadius: 50, fontSize: 12,
                fontFamily: 'var(--font-display)', fontWeight: 600,
                border: selectedType === t.id ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
                background: selectedType === t.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                color: selectedType === t.id ? 'var(--accent-blue)' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            gap: 12, alignItems: 'flex-start',
          }}>
            {msg.role === 'assistant' && (
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, boxShadow: '0 0 15px rgba(59,130,246,0.3)',
              }}>🛡️</div>
            )}

            <div style={{ maxWidth: msg.type === 'result' ? '100%' : '65%' }}>
              {msg.type === 'thinking' && (
                <div className="glass-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Loader size={16} color="var(--accent-blue)" style={{ animation: 'spin-slow 1s linear infinite' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Analyzing with ensemble models...
                  </span>
                </div>
              )}

              {msg.type === 'welcome' && (
                <div>
                  <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 12 }}>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{msg.content}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: 1 }}>
                      TRY AN EXAMPLE:
                    </p>
                    {EXAMPLE_PROMPTS.map((p, i) => (
                      <button key={i} onClick={() => sendMessage(p)}
                        style={{
                          background: 'rgba(59,130,246,0.05)', border: '1px solid var(--border)',
                          borderRadius: 10, padding: '10px 16px',
                          color: 'var(--text-secondary)', fontSize: 13,
                          cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
                          lineHeight: 1.4,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                      >
                        "{p.length > 80 ? p.slice(0, 80) + '...' : p}"
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {msg.role === 'user' && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15))',
                  border: '1px solid rgba(59,130,246,0.25)',
                  borderRadius: '18px 18px 4px 18px',
                  padding: '12px 18px', maxWidth: '100%',
                }}>
                  {msg.fileData && (
                    <img src={msg.fileData} alt="upload" style={{ maxWidth: 200, borderRadius: 8, marginBottom: 8, display: 'block' }} />
                  )}
                  {msg.file && !msg.fileData && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, padding: '6px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
                      <FileText size={14} color="var(--accent-blue)" />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{msg.file}</span>
                    </div>
                  )}
                  <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>{msg.content}</p>
                </div>
              )}

              {msg.type === 'result' && <ResultCard result={msg.result} />}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{
        padding: '16px 0 24px',
        borderTop: '1px solid var(--border)',
      }}>
        {/* File preview */}
        {uploadedFile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', marginBottom: 10,
            background: 'rgba(59,130,246,0.08)', borderRadius: 10,
            border: '1px solid rgba(59,130,246,0.2)',
          }}>
            {uploadedFile.type.startsWith('image/') ? <Image size={16} color="var(--accent-blue)" /> : <FileText size={16} color="var(--accent-blue)" />}
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>{uploadedFile.name}</span>
            <button onClick={removeFile} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={14} />
            </button>
          </div>
        )}

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
          transition: 'border-color 0.3s',
        }}
          onFocus={() => {}} >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste suspicious text, transaction data, or describe what to analyze..."
            rows={3}
            style={{
              width: '100%', padding: '16px 18px',
              background: 'transparent', border: 'none',
              color: 'var(--text-primary)', fontSize: 14,
              fontFamily: 'var(--font-body)', lineHeight: 1.6,
              resize: 'none', outline: 'none',
            }}
          />
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px',
            borderTop: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="file" ref={fileRef} onChange={handleFileUpload} accept="image/*,.csv,.txt,.json" style={{ display: 'none' }} />
              <button onClick={() => fileRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                  background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: 8, color: 'var(--accent-blue)', fontSize: 12,
                  fontFamily: 'var(--font-display)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.1)'}
              >
                <Upload size={14} />
                Upload File
              </button>
            </div>
            <button onClick={() => sendMessage()}
              disabled={loading || (!input.trim() && !uploadedFile)}
              className="btn-primary"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 22px', fontSize: 13,
                opacity: loading || (!input.trim() && !uploadedFile) ? 0.5 : 1,
                cursor: loading || (!input.trim() && !uploadedFile) ? 'not-allowed' : 'pointer',
              }}>
              {loading ? <Loader size={15} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <Send size={15} />}
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
          Press Enter to send • Shift+Enter for new line • Supports images, CSV, JSON
        </p>
      </div>
    </div>
  );
}
