import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Check,
  CheckCheck,
  Loader2,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  Scale,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../lib/apiClient';
import {
  connectChamberSocket,
  emitTypingStart,
  emitTypingStop,
  emitMessageRead,
  type ChamberSocket,
} from '../../lib/socket';
import type { ChatMessage, ChatConversation } from '../../types/doubt.types';

interface ChamberChatWindowProps {
  initialQueryContext?: {
    queryNumber?: string;
    subject?: string;
  };
}

export const ChamberChatWindow: React.FC<ChamberChatWindowProps> = ({
  initialQueryContext,
}) => {
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [peerTyping, setPeerTyping] = useState<{ isTyping: boolean; userName?: string }>({
    isTyping: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<ChamberSocket | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

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

        // Join conversation room
        socket.emit('conversation:join', { conversationId: conv._id });

        // Mark current messages as read
        emitMessageRead(conv._id);

        // Listen for new messages
        socket.on('message:new', (newMsg: ChatMessage) => {
          if (!isMounted) return;
          setMessages((prev) => {
            // Avoid duplicate by _id or clientMessageId
            if (prev.some((m) => m._id === newMsg._id || m.clientMessageId === newMsg.clientMessageId)) {
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
        // Fallback: reload conversation history
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

  return (
    <div className="flex flex-col h-[650px] rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] shadow-xs overflow-hidden animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#143564] bg-slate-50/70 dark:bg-[#061120] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0a1c36] to-[#143564] border border-[#c19b48]/40 flex items-center justify-center text-[#c19b48] shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#061120]" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-serif font-bold text-slate-900 dark:text-white">
                Adv. Rajinder Sir & Judicial Faculty
              </h3>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] font-semibold flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" />
                <span>Verified Mentor</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online in Chamber
              </span>
              <span>•</span>
              <span>Delhi High Court Chamber Complex</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {initialQueryContext?.queryNumber && (
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-mono">
              <span>Ref: {initialQueryContext.queryNumber}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (conversation) {
                apiClient.get(`/chat/conversations/${conversation._id}/messages?limit=50`).then((res) => {
                  if (res.data?.messages) setMessages(res.data.messages);
                  toast.success('Chat synchronized with chamber server');
                });
              }
            }}
            className="p-2 rounded-xl bg-white dark:bg-[#0a1c36] hover:bg-slate-100 dark:hover:bg-[#143564] border border-slate-200 dark:border-[#143564] text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Sync conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Messages Stream */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/30 dark:bg-[#061120]/40">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#c19b48]" />
            <span className="text-xs">Connecting to chamber encryption socket...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-3 p-6">
            <div className="w-12 h-12 rounded-2xl bg-[#c19b48]/10 border border-[#c19b48]/30 flex items-center justify-center text-[#c19b48]">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-serif font-bold text-slate-900 dark:text-white">
              Academic Mentorship Chamber Open
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Ask direct questions regarding Section interpretations, conflicting high court judgments, or procedural nuances. All replies are synchronized in real-time.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isMe = msg.senderRole === 'student';
              return (
                <div
                  key={msg._id || msg.clientMessageId}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`max-w-[82%] sm:max-w-[70%] rounded-2xl p-3.5 sm:p-4 text-xs leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-[#0a1c36] text-white border border-[#c19b48]/40 dark:bg-[#0a1c36]'
                        : 'bg-white dark:bg-[#143564] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {!isMe && (
                      <div className="text-[10px] font-bold text-[#c19b48] dark:text-[#e8cf8d] mb-1 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{msg.senderName} (Judicial Faculty)</span>
                      </div>
                    )}

                    <p className="whitespace-pre-wrap font-sans">{msg.message}</p>

                    <div
                      className={`flex items-center justify-end gap-1.5 mt-1.5 text-[10px] ${
                        isMe ? 'text-slate-300' : 'text-slate-400'
                      }`}
                    >
                      <span>{formatTime(msg.createdAt)}</span>

                      {/* WhatsApp-Style Delivery Ticks for Student Messages */}
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
              );
            })}

            {/* Peer Typing Indicator Bubble */}
            {peerTyping.isTyping && (
              <div className="flex items-center gap-2 text-xs text-[#c19b48] dark:text-[#e8cf8d] p-2 rounded-xl bg-[#c19b48]/10 w-fit border border-[#c19b48]/20 animate-pulse">
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

      {/* 3. Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 sm:p-4 border-t border-slate-200 dark:border-[#143564] bg-white dark:bg-[#061120] flex items-end gap-2"
      >
        <textarea
          rows={1}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question or cite a bare act provision (Enter to send)..."
          className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48] resize-none max-h-32 min-h-[42px] leading-relaxed"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="p-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-xs"
          title="Send message"
        >
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};
