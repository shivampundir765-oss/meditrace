import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n';
import api from '../../api/client';

export default function FloatingChatbot() {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(() => {
    return localStorage.getItem('meditrace_ai_ack') === 'true';
  });
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadHistory = async () => {
    try {
      const res = await api.get('/chatbot/history');
      if (res.data?.history && res.data.history.length > 0) {
        setMessages(res.data.history);
      } else {
        // Welcome message
        setMessages([
          {
            sender: 'assistant',
            text:
              language === 'hi'
                ? 'नमस्ते! मैं आपका मेडिट्रेस स्वास्थ्य सहायक हूँ। आप मुझसे अपने कैबिनेट, दवाइयों, खुराक के समय या स्टॉक की जानकारी पूछ सकते हैं।'
                : 'Hello! I am your MediTrace AI Health Assistant. Ask me anything about your medicine cabinets, dosage schedule, stock levels, or medicine safety.',
            cards: [],
            disclaimer: t('chatbot.disclaimer')
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const handleAcknowledge = () => {
    setHasAcknowledged(true);
    localStorage.setItem('meditrace_ai_ack', 'true');
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim() || loading) return;

    const userMsg = { sender: 'user', text: text.trim(), created_at: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/message', {
        message: text.trim(),
        language
      });
      const assistantMsg = res.data?.assistantMessage;
      if (assistantMsg) {
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'I apologize, but I encountered an error retrieving your records. Please try again.',
          disclaimer: t('chatbot.disclaimer')
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center space-x-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 transition-all group"
        title="Open MediTrace AI Health Assistant"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-200"></span>
        </span>
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span className="text-xs font-bold tracking-wide pr-1">
          {t('chatbot.header', 'AI Health Assistant')}
        </span>
      </button>

      {/* Side Panel Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/30 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-teal-700 to-cyan-700 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {t('chatbot.header', 'MediTrace Health Assistant')}
                  </h3>
                  <p className="text-[10px] text-teal-100 font-medium">
                    AI Assistant • Not a doctor or pharmacist
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Permanent Medical Notice Line */}
            <div className="bg-amber-50 border-b border-amber-200/60 px-4 py-2 flex items-center space-x-2 text-[11px] text-amber-900">
              <span className="shrink-0 text-amber-600 font-bold">ℹ️</span>
              <p className="leading-tight">
                For informational assistance only. In case of emergency, call <strong>112</strong> or <strong>108</strong>.
              </p>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {/* First-use Disclaimer Modal / Ack Banner */}
              {!hasAcknowledged && (
                <div className="bg-white rounded-2xl p-4 border border-teal-200 shadow-md space-y-3 animate-in fade-in">
                  <div className="flex items-center space-x-2 text-teal-800">
                    <svg className="w-5 h-5 text-teal-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h4 className="font-bold text-xs">Medical Safety Disclaimer</h4>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {t('chatbot.disclaimer')}
                  </p>
                  <button
                    onClick={handleAcknowledge}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    {t('chatbot.first_use_ack', 'I Understand')}
                  </button>
                </div>
              )}

              {/* Messages list */}
              {messages.map((m, idx) => {
                const isAssistant = m.sender === 'assistant';
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'} space-y-1.5`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        isAssistant
                          ? m.is_emergency
                            ? 'bg-red-50 text-red-900 border border-red-200 font-semibold'
                            : 'bg-white text-gray-800 border border-gray-100 shadow-xs'
                          : 'bg-teal-600 text-white font-medium shadow-xs'
                      }`}
                    >
                      <p>{m.text}</p>

                      {/* Result Cards */}
                      {m.cards && m.cards.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-gray-100 pt-2">
                          {m.cards.map((c, cIdx) => (
                            <div
                              key={cIdx}
                              className="bg-gray-50 rounded-xl p-2.5 border border-gray-200 flex items-center justify-between"
                            >
                              <div>
                                <p className="font-bold text-gray-900">{c.name}</p>
                                <p className="text-[10px] text-gray-500">
                                  {c.type === 'cabinet' && `${c.medicine_count} medicines • ${c.condition}`}
                                  {c.type === 'medicine_stock' && `Quantity: ${c.quantity} • ${c.status_label}`}
                                  {c.type === 'schedule' && `Dose: ${c.dose_amount} (${c.times})`}
                                </p>
                              </div>

                              {c.type === 'medicine_stock' && (
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                                  style={{ backgroundColor: c.color }}
                                >
                                  {c.status_label}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Response Disclaimer footnote */}
                      {isAssistant && m.disclaimer && (
                        <p className="mt-2 pt-2 border-t border-gray-100 text-[9px] text-gray-400 italic">
                          {m.disclaimer}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center space-x-2 text-xs text-gray-400 italic py-2">
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce delay-100"></div>
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce delay-200"></div>
                  <span>MediTrace is reviewing your records...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick prompts */}
            <div className="px-4 py-2 bg-gray-50/80 border-t border-gray-100 flex items-center space-x-1.5 overflow-x-auto text-[11px]">
              <button
                onClick={() => handleSend(t('chatbot.quick_1', 'Do I have a Cold cabinet?'))}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-700 transition-colors"
              >
                {t('chatbot.quick_1', 'Cold cabinet?')}
              </button>
              <button
                onClick={() => handleSend(t('chatbot.quick_2', 'What medicines are running low?'))}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-700 transition-colors"
              >
                {t('chatbot.quick_2', 'Running low?')}
              </button>
              <button
                onClick={() => handleSend(t('chatbot.quick_3', 'When do I take my doses today?'))}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-teal-400 hover:text-teal-700 transition-colors"
              >
                {t('chatbot.quick_3', 'Schedule today?')}
              </button>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white border-t border-gray-100 flex items-center space-x-2"
            >
              <input
                type="text"
                placeholder={t('chatbot.input_placeholder', 'Ask about medicines, cabinets, schedules...')}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                maxLength={1000}
                className="flex-1 text-xs rounded-xl border border-gray-200 px-3.5 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 shadow-xs"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
