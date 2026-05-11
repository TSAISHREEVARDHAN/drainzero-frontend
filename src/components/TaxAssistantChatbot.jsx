import React, { useState, useRef, useEffect } from 'react';
import { Typography } from 'antd';
import { RobotOutlined, SendOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { clearAgentHistory } from '../config/api';

// ── Call Gemini directly from browser (avoids server region restrictions) ──
const callGeminiFrontend = async (prompt) => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  const models = ['gemini-2.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 1024 }
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) return text;
      }
    } catch {}
  }
  throw new Error('AI service unavailable. Please try again.');
};

const { Text } = Typography;

const ACTION_CARDS = [
  { label: 'Which regime saves more?',  icon: '⚖️' },
  { label: 'How to maximize 80C?',      icon: '💰' },
  { label: 'Am I paying too much tax?', icon: '🔍' },
  { label: 'What is LTCG harvesting?',  icon: '📈' },
];

/* ─── Smooth typing indicator with shimmer preview ─── */
const TypingIndicator = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
    {/* Animated bot bubble */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '11px 16px',
      background: 'linear-gradient(135deg, #EEF3FA 0%, #F5F8FF 100%)',
      borderRadius: '16px 16px 16px 4px',
      width: 'fit-content',
      boxShadow: '0 2px 10px rgba(91,146,229,0.14)',
      border: '1px solid rgba(91,146,229,0.18)',
    }}>
      <RobotOutlined style={{ color: '#5B92E5', fontSize: 14 }} />
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            display: 'inline-block',
            width: 7, height: 7,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #5B92E5, #08457E)',
            animation: `dz-bounce 1.2s cubic-bezier(0.36,0.07,0.19,0.97) ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>
      <Text style={{ fontSize: 11, color: '#5B92E5', fontStyle: 'italic', fontFamily: "'Outfit', sans-serif" }}>
        Thinking…
      </Text>
    </div>

    {/* Shimmer skeleton lines — preview of incoming text */}
    {[75, 55, 40].map((w, i) => (
      <div key={i} style={{
        width: `${w}%`, height: 11, borderRadius: 6, marginLeft: 2,
        background: 'linear-gradient(90deg, #EEF3FA 25%, #D8E6F8 50%, #EEF3FA 75%)',
        backgroundSize: '300% 100%',
        animation: `dz-shimmer 1.6s ease ${i * 0.12}s infinite`,
        opacity: 1 - i * 0.18,
      }} />
    ))}

    <style>{`
      @keyframes dz-bounce {
        0%, 60%, 100% { transform: translateY(0) scale(0.88); opacity: 0.45; }
        30%            { transform: translateY(-7px) scale(1.12); opacity: 1; }
      }
      @keyframes dz-shimmer {
        0%   { background-position: 300% 0; }
        100% { background-position: -300% 0; }
      }
      /* Message fade-in */
      @keyframes dz-fadein {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `}</style>
  </div>
);

/* ─── Single message bubble ─── */
const MessageBubble = ({ msg, onActionCard }) => (
  <div
    style={{
      display: 'flex', flexDirection: 'column',
      alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
      gap: 6,
      animation: 'dz-fadein 0.22s ease',
    }}
  >
    <div style={{
      background: msg.role === 'user'
        ? 'linear-gradient(135deg, #08457E 0%, #0D5FA0 100%)'
        : '#FFFFFF',
      color: msg.role === 'user' ? '#FFFFFF' : '#1F2937',
      padding: '10px 14px',
      borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
      maxWidth: '86%',
      fontSize: 13.5, lineHeight: 1.65,
      boxShadow: msg.role === 'user'
        ? '0 2px 8px rgba(8,69,126,0.25)'
        : '0 1px 4px rgba(0,0,0,0.07)',
      whiteSpace: 'pre-line',
      fontFamily: "'Outfit', sans-serif",
    }}>
      {msg.text}
    </div>

    {/* Action cards from bot */}
    {msg.role === 'bot' && msg.actionCards?.length > 0 && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 4 }}>
        {msg.actionCards.map((card, ci) => (
          <button key={ci} onClick={() => onActionCard(card)} style={{
            background: '#EEF3FA', border: '1px solid #B8C8E6', borderRadius: 20,
            padding: '5px 12px', fontSize: 12, cursor: 'pointer', color: '#08457E',
            fontFamily: "'Outfit', sans-serif", transition: 'all 0.15s ease',
          }}
            onMouseOver={e => { e.currentTarget.style.background = '#5B92E5'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#5B92E5'; }}
            onMouseOut={e => { e.currentTarget.style.background = '#EEF3FA'; e.currentTarget.style.color = '#08457E'; e.currentTarget.style.borderColor = '#B8C8E6'; }}
          >
            <ThunderboltOutlined style={{ marginRight: 4 }} />{card}
          </button>
        ))}
      </div>
    )}
  </div>
);

/* ─── Main chatbot component ─── */
const TaxAssistantChatbot = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I am your DrainZero AI Tax Assistant.\n\nI know your income, deductions, and profile. Ask me anything about your taxes.' }
  ]);
  const [inputValue, setInputValue]   = useState('');
  const [loading, setLoading]         = useState(false);
  const [showCards, setShowCards]     = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef                = useRef(null);

  useEffect(() => {
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    setShowCards(false);
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInputValue('');
    setLoading(true);
    try {
      if (!user) throw new Error('Please login to use the AI assistant.');
      // Step 1: Get RAG context from backend (KB search + profile)
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const ctxRes  = await fetch(`${BACKEND_URL}/api/agent/search`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ userId: user.id, message: text }),
      });
      const ctx = ctxRes.ok ? await ctxRes.json() : {};

      // Step 2: Build prompt with RAG context
      const profile = ctx.userProfile || {};
      const income  = ctx.incomeData  || {};
      const tax     = ctx.taxResult   || {};
      const prompt  = `You are DrainZero, an expert Indian tax advisor for FY 2025-26.

USER PROFILE:
Name: ${profile.name || 'User'}, Employment: ${profile.employment_type || 'Unknown'}, City: ${profile.city || ''}, State: ${profile.state || ''}

INCOME & DEDUCTIONS:
Gross Salary: ₹${(income.gross_salary || 0).toLocaleString('en-IN')}
Section 80C: ₹${(income.section_80c || 0).toLocaleString('en-IN')}
Section 80D: ₹${(income.section_80d || 0).toLocaleString('en-IN')}
NPS 80CCD(1B): ₹${(income.nps_personal || 0).toLocaleString('en-IN')}
HRA: ₹${(income.hra_deduction || 0).toLocaleString('en-IN')}
Preferred Regime: ${income.preferred_regime || 'Auto Suggest'}

TAX ANALYSIS:
Old Regime Tax: ₹${(tax.old_tax || 0).toLocaleString('en-IN')}
New Regime Tax: ₹${(tax.new_tax || 0).toLocaleString('en-IN')}
Recommended: ${tax.recommended_regime || 'N/A'}
Annual Saving: ₹${(tax.saving || 0).toLocaleString('en-IN')}
Health Score: ${tax.health_score || 'N/A'}/100

RELEVANT TAX KNOWLEDGE (RAG):
${ctx.kbContext || 'No specific knowledge base match found.'}

USER QUESTION: ${text}

Answer in 3-5 sentences. Be specific with numbers from the user's profile. Use Indian tax terminology. End with one actionable tip.`;

      // Step 3: Call Gemini from browser (no region restriction)
      const reply = await callGeminiFrontend(prompt);
      const result = { success: true, message: reply };
      const reply       = result.answer || result.message || 'I could not process that. Please try again.';
      const actionCards = result.action_cards || [];
      setMessages(prev => [...prev, { role: 'bot', text: reply, actionCards }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `Something went wrong: ${err.message}. The backend may be starting up — please try again in 30 seconds.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (user) await clearAgentHistory(user.id).catch(() => {});
    setMessages([{ role: 'bot', text: 'Cleared. How can I help you with your taxes?' }]);
    setShowCards(true);
  };

  return (
    <div style={{
      marginTop: 40, borderRadius: 24,
      border: '1px solid #E5E7EB', overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      transition: 'box-shadow 0.2s ease',
    }}>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, #08457E 0%, #0D5FA0 100%)',
        padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            <RobotOutlined style={{ fontSize: 18, color: '#FFFFFF' }} />
          </div>
          <div>
            <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 14, fontFamily: "'Outfit', sans-serif" }}>
              AI Tax Assistant
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {/* Pulsing live dot */}
              <span style={{ position: 'relative', display: 'inline-block', width: 8, height: 8 }}>
                <span style={{
                  display: 'block', width: 8, height: 8, borderRadius: '50%',
                  background: '#10B981',
                }} />
                <span style={{
                  position: 'absolute', inset: -2, borderRadius: '50%',
                  background: '#10B981', opacity: 0.4,
                  animation: 'dz-ping 1.8s cubic-bezier(0,0,0.2,1) infinite',
                }} />
              </span>
              <span style={{ color: '#CCF1FF', fontSize: 11, fontFamily: "'Outfit', sans-serif" }}>
                Powered by DrainZero AI · RAG Enabled
              </span>
            </div>
          </div>
        </div>

        <button onClick={handleClear} style={{
          background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)',
          color: '#CCF1FF', borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
          fontSize: 12, fontFamily: "'Outfit', sans-serif",
          transition: 'all 0.2s ease',
        }}
          onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#CCF1FF'; }}
        >
          <DeleteOutlined /> Clear
        </button>
      </div>

      {/* ── Messages ── */}
      <div style={{ background: '#FAFBFC', padding: '20px 20px 12px' }}>
        <div style={{
          height: 300, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 12,
          paddingRight: 4,
        }}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} onActionCard={sendMessage} />
          ))}

          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick cards */}
        {showCards && (
          <div style={{ marginTop: 16, marginBottom: 4 }}>
            <div style={{
              fontSize: 10, color: '#9CA3AF',
              textTransform: 'uppercase', letterSpacing: 1,
              marginBottom: 8, fontFamily: "'Outfit', sans-serif",
            }}>
              Quick Questions
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {ACTION_CARDS.map((card, i) => (
                <button key={i} onClick={() => sendMessage(card.label)} style={{
                  background: '#F2F3F4', border: '1px solid #E5E7EB', borderRadius: 20,
                  padding: '7px 14px', fontSize: 12.5, cursor: 'pointer', color: '#374151',
                  fontFamily: "'Outfit', sans-serif", transition: 'all 0.15s ease',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = '#EEF3FA';
                    e.currentTarget.style.borderColor = '#5B92E5';
                    e.currentTarget.style.color = '#08457E';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 3px 10px rgba(91,146,229,0.15)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = '#F2F3F4';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                    e.currentTarget.style.color = '#374151';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span>{card.icon}</span> {card.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      <div style={{
        background: '#FFFFFF', padding: '12px 20px 16px',
        borderTop: '1px solid #F0F0F0',
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(inputValue)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            disabled={loading}
            placeholder="Ask a tax question…"
            style={{
              flex: 1, height: 46, borderRadius: 13,
              border: `1.5px solid ${inputFocused ? '#5B92E5' : '#E5E7EB'}`,
              padding: '0 16px', fontSize: 13.5, outline: 'none',
              fontFamily: "'Outfit', sans-serif", background: '#F9FAFB',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxShadow: inputFocused ? '0 0 0 3px rgba(91,146,229,0.12)' : 'none',
              opacity: loading ? 0.6 : 1,
            }}
          />
          <button
            onClick={() => sendMessage(inputValue)}
            disabled={loading || !inputValue.trim()}
            style={{
              width: 46, height: 46, borderRadius: 13, border: 'none',
              background: loading || !inputValue.trim()
                ? '#E5E7EB'
                : 'linear-gradient(135deg, #5B92E5 0%, #08457E 100%)',
              color: loading || !inputValue.trim() ? '#9CA3AF' : '#FFFFFF',
              cursor: loading || !inputValue.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease', flexShrink: 0,
              boxShadow: loading || !inputValue.trim() ? 'none' : '0 3px 10px rgba(91,146,229,0.3)',
            }}
            onMouseOver={e => { if (!loading && inputValue.trim()) e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <SendOutlined style={{ fontSize: 16 }} />
          </button>
        </div>
      </div>

      {/* Global keyframes */}
      <style>{`
        @keyframes dz-bounce {
          0%, 60%, 100% { transform: translateY(0) scale(0.88); opacity: 0.45; }
          30%            { transform: translateY(-7px) scale(1.12); opacity: 1; }
        }
        @keyframes dz-shimmer {
          0%   { background-position: 300% 0; }
          100% { background-position: -300% 0; }
        }
        @keyframes dz-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dz-ping {
          0%   { transform: scale(1);    opacity: 0.4; }
          80%  { transform: scale(2.2);  opacity: 0; }
          100% { transform: scale(2.2);  opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default TaxAssistantChatbot;
