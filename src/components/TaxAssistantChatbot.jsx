import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Typography, Space, Spin, Tag } from 'antd';
import { RobotOutlined, UserOutlined, SendOutlined, DeleteOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { askAgent, clearAgentHistory } from '../config/api';

const { Title, Text } = Typography;

// Quick action suggestion cards
const ACTION_CARDS = [
  { label: 'Which regime saves more?', icon: '⚖️' },
  { label: 'How to maximize 80C?', icon: '💰' },
  { label: 'Am I paying too much tax?', icon: '🔍' },
  { label: 'What is LTCG harvesting?', icon: '📈' },
];

const TaxAssistantChatbot = () => {
  const { user } = useAuth();
  const [messages, setMessages]     = useState([
    { role: 'bot', text: 'Hi! I am your AI Tax Assistant powered by DrainZero. Ask me anything about your tax situation, deductions, or strategies.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading]       = useState(false);
  const [showCards, setShowCards]   = useState(true);
  const messagesEndRef              = useRef(null);

  useEffect(() => {
    // Only auto-scroll when user sends a new message — NOT on initial page load
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    setShowCards(false);
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInputValue('');
    setLoading(true);

    try {
      if (!user) throw new Error('Please login to use the AI assistant.');
      const result = await askAgent(user.id, text);
      const reply  = result.answer || result.message || 'I could not process that. Please try again.';

      // Parse action cards from result if backend sends them
      const actionCards = result.action_cards || [];

      setMessages(prev => [...prev, { role: 'bot', text: reply, actionCards }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: `Sorry, something went wrong: ${err.message}. The backend may be starting up — please try again in 30 seconds.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (user) await clearAgentHistory(user.id).catch(() => {});
    setMessages([{ role: 'bot', text: 'Conversation cleared. How can I help you with your taxes?' }]);
    setShowCards(true);
  };

  return (
    <Card
      style={{ marginTop: 40, borderRadius: 24, border: '1px solid #B8C8E6', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
      bodyStyle={{ padding: 0 }}
    >
      {/* Header */}
      <div style={{ background: '#08457E', padding: '20px 24px', borderTopLeftRadius: 24, borderTopRightRadius: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ color: '#FFFFFF', margin: 0 }}>
            <RobotOutlined style={{ marginRight: 8 }} /> AI Tax Assistant
          </Title>
          <Text style={{ color: '#CCF1FF', fontSize: 13 }}>Powered by DrainZero + Gemini</Text>
        </div>
        <Button
          icon={<DeleteOutlined />} size="small" onClick={handleClear}
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#CCF1FF', borderRadius: 8 }}
        />
      </div>

      {/* Chat area */}
      <div style={{ padding: 24, background: '#FFFFFF', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <div style={{ height: 280, overflowY: 'auto', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 6 }}>
          {messages.map((msg, i) => (
            <div key={i}>
              <div style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                background: msg.role === 'user' ? '#5B92E5' : '#F2F3F4',
                color: msg.role === 'user' ? '#FFF' : '#1F2937',
                padding: '12px 16px', borderRadius: 16, maxWidth: '88%',
                borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                borderBottomLeftRadius : msg.role === 'bot'  ? 4 : 16,
                display: 'inline-block',
                float: msg.role === 'user' ? 'right' : 'left',
                clear: 'both',
              }}>
                <Space size={8} align="start" style={{ display: 'flex' }}>
                  {msg.role === 'bot' && <RobotOutlined style={{ fontSize: 15, marginTop: 3, color: '#084C8D', flexShrink: 0 }} />}
                  <Text style={{ color: 'inherit', display: 'block', whiteSpace: 'pre-line', fontSize: 14 }}>{msg.text}</Text>
                  {msg.role === 'user' && <UserOutlined style={{ fontSize: 15, marginTop: 3, color: '#FFF', flexShrink: 0 }} />}
                </Space>
              </div>

              {/* Action Cards from bot response */}
              {msg.role === 'bot' && msg.actionCards?.length > 0 && (
                <div style={{ clear: 'both', marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {msg.actionCards.map((card, ci) => (
                    <Tag
                      key={ci}
                      onClick={() => sendMessage(card)}
                      style={{ cursor: 'pointer', borderRadius: 20, padding: '6px 14px', fontSize: 12, background: '#EEF3FA', color: '#08457E', border: '1px solid #B8C8E6' }}
                    >
                      <ThunderboltOutlined style={{ marginRight: 4 }} />{card}
                    </Tag>
                  ))}
                </div>
              )}
              <div style={{ clear: 'both' }} />
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#F2F3F4', borderRadius: 16, width: 'fit-content' }}>
              <RobotOutlined style={{ color: '#084C8D' }} />
              <Spin size="small" />
              <Text style={{ color: '#6B7280', fontSize: 13 }}>Thinking...</Text>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Cards */}
        {showCards && (
          <div style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 10 }}>Quick Questions</Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ACTION_CARDS.map((card, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(card.label)}
                  style={{
                    background: '#F2F3F4', border: '1px solid #B8C8E6', borderRadius: 20,
                    padding: '8px 14px', fontSize: 12, cursor: 'pointer', color: '#08457E',
                    fontFamily: "'Outfit', sans-serif", fontWeight: 500,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseOver={e => e.target.style.background = '#EEF3FA'}
                  onMouseOut={e => e.target.style.background = '#F2F3F4'}
                >
                  {card.icon} {card.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <Space.Compact style={{ width: '100%' }}>
          <Input
            size="large"
            placeholder="Ask a tax question..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onPressEnter={() => sendMessage(inputValue)}
            disabled={loading}
            style={{ borderRadius: '12px 0 0 12px' }}
          />
          <Button
            type="primary" size="large" icon={<SendOutlined />}
            onClick={() => sendMessage(inputValue)}
            loading={loading}
            style={{ borderRadius: '0 12px 12px 0', background: '#5B92E5', border: 'none', width: 60 }}
          />
        </Space.Compact>
      </div>
    </Card>
  );
};
export default TaxAssistantChatbot;
