import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Check,
  CheckCheck,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import { apiClient } from '../../lib/apiClient';
import {
  connectChamberSocket,
  emitTypingStart,
  emitTypingStop,
  emitMessageRead,
  type ChamberSocket,
} from '../../lib/socket';
import type { ChatMessage, ChatConversation } from '../../types/doubt.types';
import { ChatStreamSkeleton } from '../../components/ui/skeleton';

export const ChamberChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Query Context from escalation or URL
  const queryRef = searchParams.get('ref');
  const querySubject = searchParams.get('subject');

  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [peerTyping, setPeerTyping] = useState<{ isTyping: boolean; userName?: string }>({
    isTyping: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<ChamberSocket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // Lock body scroll on mount
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Virtual Keyboard / Visual Viewport resize handler
  useEffect(() => {
    const handleViewportResize = () => {
      scrollToBottom(false);
    };

    window.visualViewport?.addEventListener('resize', handleViewportResize);
    window.visualViewport?.addEventListener('scroll', handleViewportResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
      window.visualViewport?.removeEventListener('scroll', handleViewportResize);
    };
  }, [scrollToBottom]);

  // Back navigation helper
  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard/doubts');
    }
  };

  // 1. Initialize Conversation & Socket
  useEffect(() => {
    let isMounted = true;

    const initChat = async () => {
      try {
        setIsLoading(true);

        // Fetch or create 1-to-1 conversation with faculty chamber
        const convRes = await apiClient.post('/chat/init', {});
        const conv: ChatConversation = convRes.data?.conversation;

        if (!isMounted || !conv) return;
        setConversation(conv);

        // Fetch message history
        const msgRes = await apiClient.get(`/chat/conversations/${conv._id}/messages?limit=50`);
        if (isMounted && msgRes.data?.messages) {
          setMessages(msgRes.data.messages);
          setTimeout(() => scrollToBottom(false), 50);
        }

        // Connect Socket
        const socket = await connectChamberSocket();
        socketRef.current = socket;
        setIsConnected(socket.connected);

        // Join conversation room
        socket.emit('conversation:join', { conversationId: conv._id });

        // Auto re-join room upon reconnection
        const handleConnect = () => {
          if (!isMounted) return;
          setIsConnected(true);
          socket.emit('conversation:join', { conversationId: conv._id });
        };

        const handleDisconnect = () => {
          if (!isMounted) return;
          setIsConnected(false);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        // Mark current messages as read
        emitMessageRead(conv._id);

        // Listen for new messages
        socket.on('message:new', (newMsg: ChatMessage) => {
          if (!isMounted) return;
          setMessages((prev) => {
            // Avoid duplicate by _id or clientMessageId
            if (prev.some((m) => m._id === newMsg._id || (m.clientMessageId && m.clientMessageId === newMsg.clientMessageId))) {
              return prev.map((m) =>
                m.clientMessageId === newMsg.clientMessageId ? newMsg : m
              );
            }
            return [...prev, newMsg];
          });

          // Mark incoming message as read
          if (newMsg.senderRole !== 'student') {
            emitMessageRead(conv._id);
          }

          setTimeout(() => scrollToBottom(true), 50);
        });

        // Listen for delivery updates
        socket.on('message:delivered', ({ conversationId, messageIds }) => {
          if (!isMounted || conversationId !== conv._id) return;
          setMessages((prev) =>
            prev.map((m) =>
              messageIds.includes(m._id) && m.deliveryStatus === 'sent'
                ? { ...m, deliveryStatus: 'delivered' }
                : m
            )
          );
        });

        // Listen for read receipts (turning ticks Double Gold)
        socket.on('message:read', ({ conversationId }) => {
          if (!isMounted || conversationId !== conv._id) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.senderRole === 'student'
                ? { ...m, deliveryStatus: 'read' }
                : m
            )
          );
        });

        // Listen for typing events
        socket.on('typing:start', ({ conversationId, userName }) => {
          if (!isMounted || conversationId !== conv._id) return;
          setPeerTyping({ isTyping: true, userName });
          setTimeout(() => scrollToBottom(true), 50);
        });

        socket.on('typing:stop', ({ conversationId }) => {
          if (!isMounted || conversationId !== conv._id) return;
          setPeerTyping({ isTyping: false });
        });
      } catch (err: any) {
        console.error('Failed to initialize chamber chat:', err);
        toast.error('Unable to connect to live mentorship chamber.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initChat();

    return () => {
      isMounted = false;
      if (socketRef.current && conversation) {
        socketRef.current.emit('conversation:leave', { conversationId: conversation._id });
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('message:new');
        socketRef.current.off('message:delivered');
        socketRef.current.off('message:read');
        socketRef.current.off('typing:start');
        socketRef.current.off('typing:stop');
      }
    };
  }, [scrollToBottom]);

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);

    // Auto-grow textarea height
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;

    if (!conversation) return;

    emitTypingStart(conversation._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (conversation) {
        emitTypingStop(conversation._id);
      }
    }, 2000);
  };

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanMsg = inputText.trim();
    if (!cleanMsg || !conversation || isSending) return;

    const clientMsgId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Optimistic UI message
    const optimisticMsg: ChatMessage = {
      _id: `temp-${Date.now()}`,
      conversationId: conversation._id,
      senderId: 'self',
      senderRole: 'student',
      senderName: 'Me',
      message: cleanMsg,
      clientMessageId: clientMsgId,
      deliveryStatus: 'sent',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsSending(true);
    setTimeout(() => scrollToBottom(true), 50);

    if (conversation) {
      emitTypingStop(conversation._id);
    }

    try {
      const socket = socketRef.current;
      if (socket && socket.connected) {
        socket.emit(
          'message:send',
          {
            conversationId: conversation._id,
            message: cleanMsg,
            clientMessageId: clientMsgId,
          },
          (res: any) => {
            setIsSending(false);
            if (res?.success && res.message) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.clientMessageId === clientMsgId ? res.message : m
                )
              );
            }
          }
        );
      } else {
        // Fallback: reload conversation history via REST
        const res = await apiClient.get(`/chat/conversations/${conversation._id}/messages?limit=50`);
        if (res.data?.messages) {
          setMessages(res.data.messages);
        }
        setIsSending(false);
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message. Please retry.');
      setIsSending(false);
    }
  };

  // Keyboard shortcut: Enter to send (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format timestamp helper
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Format date grouping divider
  const formatDateLabel = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 h-[100dvh] w-full flex flex-col bg-[#efeae2]/45 dark:bg-[#040b14] text-slate-800 dark:text-slate-100 overflow-hidden overscroll-none select-text transition-colors">
      {/* 1. Dedicated WhatsApp-Style Chat Header */}
      <header className="px-3 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200/80 dark:border-[#143564] bg-[#0a1c36] text-white shrink-0 shadow-md flex items-center justify-between gap-3 pt-[max(0.625rem,env(safe-area-inset-top))] z-20">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Back Action */}
          <button
            type="button"
            onClick={handleBack}
            className="p-2 -ml-1 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white cursor-pointer shrink-0"
            title="Back to Doubt Desk"
            aria-label="Back to Doubt Desk"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Faculty / Chamber Avatar */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-[#c19b48]/60 bg-[#0a1c36] p-0.5 flex items-center justify-center shadow-sm">
              <img
                src="/logo.png"
                alt="Rajinder Law Academy"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
          </div>

          {/* Title & Presence */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="text-sm sm:text-base font-serif font-bold text-white truncate leading-tight">
                Rajinder Law Academy
              </h1>
              <span className="hidden xs:inline-flex text-[10px] px-2 py-0.2 rounded-full bg-[#c19b48]/20 text-[#e8cf8d] border border-[#c19b48]/30 font-semibold items-center gap-0.5 shrink-0">
                <ShieldCheck className="w-2.5 h-2.5" />
                <span>Verified Mentor</span>
              </span>
            </div>

            {peerTyping.isTyping ? (
              <div className="flex items-center gap-2 text-[11px] text-slate-300 truncate">
                <span className="text-emerald-400 font-medium animate-pulse truncate">
                  {peerTyping.userName || 'Faculty'} is drafting legal reasoning...
                </span>
              </div>
            ) : !isConnected ? (
              <div className="flex items-center gap-2 text-[11px] text-amber-300 truncate">
                <WifiOff className="w-3 h-3 shrink-0" />
                <span>Reconnecting to Chamber...</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 shrink-0">
          {queryRef && (
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#c19b48]/20 border border-[#c19b48]/30 text-[#e8cf8d] text-xs font-mono">
              <span>Ref: {queryRef}</span>
              {querySubject && <span className="opacity-75">• {querySubject}</span>}
            </div>
          )}
        </div>
      </header>

      {/* 2. Messages Stream (Scrollable Center Column) */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 touch-pan-y">
        <div className="max-w-4xl mx-auto w-full space-y-4">
          {isLoading ? (
            <ChatStreamSkeleton count={4} />
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-md mx-auto space-y-3 p-6 bg-white/80 dark:bg-[#0a1c36]/80 rounded-3xl border border-slate-200 dark:border-[#143564] shadow-xs backdrop-blur-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#c19b48]/10 border border-[#c19b48]/30 flex items-center justify-center text-[#c19b48]">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h2 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                Academic Mentorship Chamber Open
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Connect directly with Adv. Rajinder Sir & the judicial faculty. Ask statutory questions, discuss Bare Act provisions, or seek guidance on conflicting rulings.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                const isMe = msg.senderRole === 'student';
                const currentDateLabel = formatDateLabel(msg.createdAt);
                const prevDateLabel = index > 0 ? formatDateLabel(messages[index - 1].createdAt) : null;
                const showDateDivider = currentDateLabel !== prevDateLabel;

                return (
                  <React.Fragment key={msg._id || msg.clientMessageId || index}>
                    {/* Date Divider Pill */}
                    {showDateDivider && (
                      <div className="flex justify-center my-3 sm:my-4">
                        <span className="text-[10px] font-semibold uppercase px-3 py-1 rounded-full bg-slate-200/80 dark:bg-[#0a1c36] text-slate-600 dark:text-slate-400 border border-slate-300/60 dark:border-[#143564] shadow-2xs">
                          {currentDateLabel}
                        </span>
                      </div>
                    )}

                    {/* Message Bubble Container */}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
                      <div
                        className={`rounded-2xl p-3 sm:p-4 text-xs sm:text-[13px] leading-relaxed shadow-xs transition-all ${
                          isMe
                            ? 'max-w-[85%] sm:max-w-[65%] lg:max-w-[55%] bg-[#0a1c36] text-white border border-[#c19b48]/40 dark:bg-[#0a1c36] rounded-br-xs'
                            : 'max-w-[88%] sm:max-w-[70%] lg:max-w-[60%] bg-white dark:bg-[#143564] text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/80 rounded-bl-xs'
                        }`}
                      >
                        {/* Faculty Sender Header */}
                        {!isMe && (
                          <div className="text-[11px] font-bold text-[#c19b48] dark:text-[#e8cf8d] mb-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 shrink-0" />
                            <span>{msg.senderName} (Judicial Faculty)</span>
                          </div>
                        )}

                        {/* Content */}
                        <p className="whitespace-pre-wrap font-sans break-words leading-relaxed">
                          {msg.message}
                        </p>

                        {/* Metadata Footer */}
                        <div
                          className={`flex items-center justify-end gap-1.5 mt-1.5 text-[10px] ${
                            isMe ? 'text-slate-300' : 'text-slate-400'
                          }`}
                        >
                          <span>{formatTime(msg.createdAt)}</span>

                          {/* WhatsApp-Style Delivery Ticks */}
                          {isMe && (
                            <span>
                              {msg.deliveryStatus === 'read' ? (
                                <span title="Read by Faculty (Double Gold Ticks)">
                                  <CheckCheck className="w-3.5 h-3.5 text-[#e8cf8d]" />
                                </span>
                              ) : msg.deliveryStatus === 'delivered' ? (
                                <span title="Delivered to Chamber (Double Grey Ticks)">
                                  <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                                </span>
                              ) : (
                                <span title="Sent to Server (Single Grey Tick)">
                                  <Check className="w-3.5 h-3.5 text-slate-400" />
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* Peer Typing Indicator Bubble */}
              {peerTyping.isTyping && (
                <div className="flex items-center gap-2 text-xs text-[#c19b48] dark:text-[#e8cf8d] px-3.5 py-2 rounded-2xl bg-white dark:bg-[#0a1c36] w-fit border border-[#c19b48]/30 shadow-xs animate-in fade-in duration-150">
                  <span className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-[#c19b48] rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[#c19b48] rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-[#c19b48] rounded-full animate-bounce [animation-delay:0.4s]" />
                  </span>
                  <span className="text-[11px] font-medium">
                    {peerTyping.userName || 'Faculty'} is drafting legal reasoning...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </main>

      {/* 3. Sticky Bottom Composer Bar */}
      <footer className="sticky bottom-0 shrink-0 border-t border-slate-200/90 dark:border-[#143564] bg-white dark:bg-[#0a1c36] p-2.5 sm:p-3.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg z-20">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto w-full flex items-end gap-2 sm:gap-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 p-2.5 sm:p-3 rounded-2xl bg-slate-100/80 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48] resize-none max-h-32 min-h-[44px] leading-relaxed transition-colors"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="w-11 h-11 rounded-2xl sm:rounded-full bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-md active:scale-95"
            title="Send Message"
            aria-label="Send Message"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </footer>
    </div>
  );
};
export default ChamberChatPage;
