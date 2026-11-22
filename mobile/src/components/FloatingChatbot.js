import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Linking,
  Dimensions
} from 'react-native';
import mobileClient from '../api/client';
import storage from '../api/storage';
import { useTranslation } from '../i18n';
import { useProfile } from '../context/ProfileContext';

const { width, height } = Dimensions.get('window');

export default function FloatingChatbot() {
  const { t, language } = useTranslation();
  const { activeProfile } = useProfile();

  const [isOpen, setIsOpen] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollViewRef = useRef(null);

  useEffect(() => {
    checkAcknowledgement();
  }, []);

  useEffect(() => {
    if (activeProfile?._id) {
      loadChatHistory(activeProfile._id);
    }
  }, [activeProfile?._id]);

  const checkAcknowledgement = async () => {
    const ack = await storage.getItem('meditrace_disclaimer_ack_v3');
    if (ack === 'true') {
      setHasAcknowledged(true);
    }
  };

  const handleAcknowledge = async () => {
    await storage.setItem('meditrace_disclaimer_ack_v3', 'true');
    setHasAcknowledged(true);
  };

  const loadChatHistory = async (profileId) => {
    try {
      const stored = await storage.getItem(`meditrace_chat_history_${profileId}`);
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        const welcome = {
          role: 'assistant',
          content: language === 'hi'
            ? `नमस्ते! मैं मेडीट्रेस एआई सहायक हूँ (${activeProfile?.name || 'User'} के लिए)। मैं आपके कैबिनेट, दवाइयों के स्टॉक और खुराक शेड्यूल की जानकारी दे सकता हूँ। मैं क्या मदद करूँ?`
            : `Hello! I am your MediTrace AI assistant for ${activeProfile?.name || 'User'}. You can ask me about your cabinets, medicine stocks, or dose schedules. How can I help you today?`,
          tool_cards: []
        };
        setMessages([welcome]);
      }
    } catch (_e) {
      setMessages([]);
    }
  };

  const saveChatHistory = async (newMsgs) => {
    if (activeProfile?._id) {
      await storage.setItem(
        `meditrace_chat_history_${activeProfile._id}`,
        JSON.stringify(newMsgs)
      );
    }
  };

  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInputValue('');
    setLoading(true);

    try {
      const res = await mobileClient.post('/chatbot/message', {
        message: text,
        profile_id: activeProfile?._id,
        language
      });

      const replyData = res.data || {};
      const assistantMsg = {
        role: 'assistant',
        content: replyData.reply || replyData.message || (language === 'hi' ? 'जानकारी प्राप्त हुई।' : 'Here is the requested information.'),
        tool_cards: replyData.tool_cards || [],
        disclaimer: replyData.disclaimer || t('chatbot.disclaimer')
      };

      const finalMsgs = [...updated, assistantMsg];
      setMessages(finalMsgs);
      await saveChatHistory(finalMsgs);
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: language === 'hi'
          ? 'सॉरी, संदेश प्रोसेस करने में त्रुटि हुई। कृपया पुनः प्रयास करें।'
          : 'Sorry, I encountered an error. Please try again.',
        tool_cards: []
      };
      setMessages([...updated, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleCallEmergency = () => {
    Linking.openURL('tel:112');
  };

  return (
    <>
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>🤖</Text>
        <Text style={styles.fabText}>AI Chat</Text>
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{t('chatbot.title')}</Text>
              <Text style={styles.headerSub}>
                {activeProfile ? `${activeProfile.name} • ` : ''}{t('chatbot.header_sub')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Permanent Disclaimer Strip */}
          <View style={styles.permanentDisclaimer}>
            <Text style={styles.disclaimerText}>
              ⚕️ {t('chatbot.disclaimer')}
            </Text>
          </View>

          {!hasAcknowledged ? (
            /* First Use Intro Acknowledgement */
            <View style={styles.ackContainer}>
              <Text style={styles.ackIcon}>⚠️</Text>
              <Text style={styles.ackTitle}>{t('chatbot.first_use_title')}</Text>
              <Text style={styles.ackBody}>
                {t('chatbot.disclaimer')}
              </Text>
              <Text style={styles.ackEmergencyNotice}>
                {t('chatbot.emergency_warning')}
              </Text>
              <TouchableOpacity
                style={styles.emergencyBtn}
                onPress={handleCallEmergency}
              >
                <Text style={styles.emergencyBtnText}>🚨 {t('chatbot.emergency_call_btn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.ackBtn}
                onPress={handleAcknowledge}
              >
                <Text style={styles.ackBtnText}>{t('chatbot.first_use_accept')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Chat Interface */
            <View style={styles.chatArea}>
              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesScroll}
                contentContainerStyle={styles.messagesContent}
              >
                {messages.map((msg, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.messageBubble,
                      msg.role === 'user' ? styles.userBubble : styles.assistantBubble
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.role === 'user' ? styles.userText : styles.assistantText
                      ]}
                    >
                      {msg.content}
                    </Text>

                    {/* Tool Cards */}
                    {msg.tool_cards && msg.tool_cards.length > 0 && (
                      <View style={styles.cardsWrap}>
                        {msg.tool_cards.map((card, cIdx) => (
                          <View key={cIdx} style={styles.toolCard}>
                            <Text style={styles.cardTitle}>
                              {card.medicine_name || card.name || 'Record Details'}
                            </Text>
                            {card.status ? (
                              <Text style={styles.cardBadge}>Status: {card.status}</Text>
                            ) : null}
                            {card.condition ? (
                              <Text style={styles.cardSub}>Condition: {card.condition}</Text>
                            ) : null}
                            {card.remaining !== undefined ? (
                              <Text style={styles.cardSub}>Remaining: {card.remaining} units</Text>
                            ) : null}
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Safety Footnote */}
                    {msg.disclaimer && (
                      <Text style={styles.footnote}>
                        ℹ️ {msg.disclaimer}
                      </Text>
                    )}
                  </View>
                ))}

                {loading && (
                  <View style={styles.typingContainer}>
                    <ActivityIndicator size="small" color="#0d9488" />
                    <Text style={styles.typingText}>Consulting MediTrace records...</Text>
                  </View>
                )}
              </ScrollView>

              {/* Input Area */}
              <View style={styles.inputBar}>
                <TextInput
                  style={styles.inputField}
                  placeholder={t('chatbot.input_placeholder')}
                  placeholderTextColor="#94a3b8"
                  value={inputValue}
                  onChangeText={setInputValue}
                  onSubmitEditing={handleSendMessage}
                  returnKeyType="send"
                />
                <TouchableOpacity
                  style={[styles.sendBtn, !inputValue.trim() && styles.sendBtnDisabled]}
                  onPress={handleSendMessage}
                  disabled={!inputValue.trim() || loading}
                >
                  <Text style={styles.sendBtnText}>➤</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 74,
    right: 16,
    backgroundColor: '#0d9488',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 999
  },
  fabIcon: {
    fontSize: 18,
    marginRight: 6
  },
  fabText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  headerInfo: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  closeBtn: {
    padding: 6
  },
  closeBtnText: {
    fontSize: 20,
    color: '#64748b'
  },
  permanentDisclaimer: {
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  disclaimerText: {
    fontSize: 10,
    color: '#92400e',
    lineHeight: 14
  },
  ackContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff'
  },
  ackIcon: {
    fontSize: 48,
    marginBottom: 16
  },
  ackTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center'
  },
  ackBody: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20
  },
  ackEmergencyNotice: {
    fontSize: 13,
    color: '#b91c1c',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 12
  },
  emergencyBtn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center'
  },
  emergencyBtnText: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 14
  },
  ackBtn: {
    backgroundColor: '#0d9488',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center'
  },
  ackBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15
  },
  chatArea: {
    flex: 1
  },
  messagesScroll: {
    flex: 1
  },
  messagesContent: {
    padding: 16
  },
  messageBubble: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    maxWidth: '85%'
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0d9488'
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20
  },
  userText: {
    color: '#ffffff'
  },
  assistantText: {
    color: '#1e293b'
  },
  cardsWrap: {
    marginTop: 10
  },
  toolCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#0d9488'
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  cardBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b45309',
    marginTop: 2
  },
  cardSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  footnote: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 4
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10
  },
  typingText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 8
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'
  },
  inputField: {
    flex: 1,
    height: 42,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#0f172a'
  },
  sendBtn: {
    marginLeft: 8,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sendBtnDisabled: {
    backgroundColor: '#cbd5e1'
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
