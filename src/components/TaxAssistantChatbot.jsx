import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Typography, Space, Tag } from 'antd';
import { RobotOutlined, UserOutlined, SendOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { askAgent, clearAgentHistory } from '../config/api';

const { Title, Text } = Typography;

const ACTION_CARDS = [
  { label: 'Which regime saves more?',  icon: '⚖️' },
  { label: 'How to maximize 80C?',      icon: '💰' },
  { label: 'Am I paying too much tax?', icon: '🔍' },
  { label: 'What is LTCG harvesting?',  icon: '📈' },
];

// Minimal pulse loading — just 3 small dots, clean and simple
const TypingDots = () => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px',
    background: '#F2F3F4',
    borderRadius: '16px 16px 16px 4px',
    width: 'fit-content',
  }}>
    <RobotOutlined style={{ color: '#5B92E5', fontSize: 14 }} />
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          display: 'inline-block',
          width: 6, height: 6,
          borderRadius: '50%',
          background: '#5B92E5',
          opacity: 0.3,
          animation: `dz-pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
    <style>{`
      @keyframes dz-pulse {
        0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
        40%            { opacity: 1;    transform: scale(1.15); }
      }
    `}</style>
  </div>
);

const TaxAssistantChatbot = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I am your AI Tax Assistant. I can explain your tax position, compare regimes, and answer Indian tax questions using your saved profile and knowledge base.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading]       = useState(false);
  const [showCards, setShowCards]   = useState(true);
  const messagesEndRef              = useRef(null);

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
      const result     = await askAgent(user.id, text);
      const reply      = result.answer || result.message || 'I could not process that. Please try again.';
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
    <div style={{ marginTop: 40, borderRadius: 24, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div style={{
        background: '#08457E', padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RobotOutlined style={{ fontSize: 18, color: '#FFFFFF' }} />
          </div>
          <div>
            <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 14, fontFamily: "'Outfit', sans-serif" }}>AI Tax Assistant</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
              <span style={{ color: '#CCF1FF', fontSize: 11 }}>Powered by Gemini · Tax Knowledge Search</span>
            </div>
          </div>
        </div>
        <button onClick={handleClear} style={{
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#CCF1FF', borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
          fontSize: 12, fontFamily: "'Outfit', sans-serif",
          transition: 'background 0.2s',
        }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >
          <DeleteOutlined /> Clear
        </button>
      </div>

      {/* Messages */}
      <div style={{ background: '#FAFBFC', padding: '20px 20px 12px' }}>
        <div style={{ height: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
              <div style={{
                background: msg.role === 'user' ? '#08457E' : '#FFFFFF',
                color: msg.role === 'user' ? '#FFFFFF' : '#1F2937',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                maxWidth: '86%',
                fontSize: 13.5,
                lineHeight: 1.65,
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                whiteSpace: 'pre-line',
                fontFamily: "'Outfit', sans-serif",
              }}>
                {msg.text}
              </div>
              {msg.role === 'bot' && msg.actionCards?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 4 }}>
                  {msg.actionCards.map((card, ci) => (
                    <button key={ci} onClick={() => sendMessage(card)} style={{
                      background: '#EEF3FA', border: '1px solid #B8C8E6', borderRadius: 20,
                      padding: '5px 12px', fontSize: 12, cursor: 'pointer', color: '#08457E',
                      fontFamily: "'Outfit', sans-serif", transition: 'all 0.15s ease',
                    }}
                      onMouseOver={e => { e.currentTarget.style.background = '#5B92E5'; e.currentTarget.style.color = '#fff'; }}
                      onMouseOut={e => { e.currentTarget.style.background = '#EEF3FA'; e.currentTarget.style.color = '#08457E'; }}
                    >
                      <ThunderboltOutlined style={{ marginRight: 4 }} />{card}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && <TypingDots />}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick cards */}
        {showCards && (
          <div style={{ marginTop: 12, marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Quick Questions</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ACTION_CARDS.map((card, i) => (
                <button key={i} onClick={() => sendMessage(card.label)} style={{
                  background: '#F2F3F4', border: '1px solid #E5E7EB', borderRadius: 20,
                  padding: '7px 13px', fontSize: 12, cursor: 'pointer', color: '#374151',
                  fontFamily: "'Outfit', sans-serif", transition: 'all 0.15s ease',
                }}
                  onMouseOver={e => { e.currentTarget.style.background = '#EEF3FA'; e.currentTarget.style.borderColor = '#5B92E5'; e.currentTarget.style.color = '#08457E'; }}
                  onMouseOut={e => { e.currentTarget.style.background = '#F2F3F4'; e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151'; }}
                >
                  {card.icon} {card.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div style={{ background: '#FFFFFF', padding: '12px 20px 16px', borderTop: '1px solid #F0F0F0' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(inputValue)}
            disabled={loading}
            placeholder="Ask a tax question..."
            style={{
              flex: 1, height: 44, borderRadius: 12, border: '1.5px solid #E5E7EB',
              padding: '0 14px', fontSize: 13.5, outline: 'none',
              fontFamily: "'Outfit', sans-serif", background: '#F9FAFB',
              transition: 'border-color 0.2s',
              opacity: loading ? 0.6 : 1,
            }}
            onFocus={e => e.target.style.borderColor = '#5B92E5'}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
          />
          <button onClick={() => sendMessage(inputValue)} disabled={loading || !inputValue.trim()} style={{
            width: 44, height: 44, borderRadius: 12, border: 'none',
            background: loading || !inputValue.trim() ? '#E5E7EB' : '#5B92E5',
            color: loading || !inputValue.trim() ? '#9CA3AF' : '#FFFFFF',
            cursor: loading || !inputValue.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease', flexShrink: 0,
          }}
            onMouseOver={e => { if (!loading && inputValue.trim()) e.currentTarget.style.background = '#08457E'; }}
            onMouseOut={e => { if (!loading && inputValue.trim()) e.currentTarget.style.background = '#5B92E5'; }}
          >
            <SendOutlined style={{ fontSize: 16 }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaxAssistantChatbot;
