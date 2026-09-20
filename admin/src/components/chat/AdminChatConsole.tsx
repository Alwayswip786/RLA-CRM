import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Check,
  CheckCheck,
  Loader2,
  RefreshCw,
  Search,
  MessageSquare,
  Scale,
  Sparkles,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../lib/apiClient';
import {
  connectAdminSocket,
  emitTypingStart,
  emitTypingStop,
  emitMessageRead,
  type AdminChamberSocket,
} from '../../lib/socket';
import { CannedLegalResponses } from './CannedLegalResponses';
import type { ChatMessage, ChatConversation } from '../../types/doubt.types';

export const AdminChatConsole: React.FC = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [peerTyping, setPeerTyping] = useState<{ isTyping: boolean; userName?: string }>({
    isTyping: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<AdminChamberSocket | null>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, []);

  // 1. Fetch Conversations
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoadingConvs(true);
      const res = await apiClient.get('/chat/conversations');
      if (res.data?.conversations) {
        setConversations(res.data.conversations);
        if (!selectedConvId && res.data.conversations.length > 0) {
          setSelectedConvId(res.data.conversations[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      toast.error('Failed to load active student conversations.');
    } finally {
      setIsLoadingConvs(false);
    }
  }, [selectedConvId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // 2. Connect Admin Socket
  useEffect(() => {
    let isMounted = true;

    connectAdminSocket()
      .then((socket) => {
        if (!isMounted) return;
        socketRef.current = socket;

        socket.on('conversation:updated', ({ conversationId, lastMessageAt, lastMessagePreview }) => {
          setConversations((prev) =>
            prev.map((c) =>
              c._id === conversationId
                ? {
                    ...c,
                    lastMessageAt,
                    lastMessagePreview,
                    unreadCountAdmin:
                      c._id === selectedConvId ? 0 : (c.unreadCountAdmin || 0) + 1,
                  }
                : c
            )
          );
        });
      })
      .catch((err) => console.error('Admin socket connection error:', err));

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.off('conversation:updated');
      }
    };
  }, [selectedConvId]);

  // 3. Handle Selected Conversation Change
  useEffect(() => {
    if (!selectedConvId) return;

    let isMounted = true;
    const socket = socketRef.current;

    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const res = await apiClient.get(`/chat/conversations/${selectedConvId}/messages?limit=50`);
        if (isMounted && res.data?.messages) {
          setMessages(res.data.messages);
          setTimeout(() => scrollToBottom(false), 50);
        }

        // Mark as read via socket and HTTP fallback
        emitMessageRead(selectedConvId);
        setConversations((prev) =>
          prev.map((c) => (c._id === selectedConvId ? { ...c, unreadCountAdmin: 0 } : c))
        );

        if (socket && socket.connected) {
          socket.emit('conversation:join', { conversationId: selectedConvId });
        }
      } catch (err) {
        console.error('Failed to load messages for conversation:', err);
      } finally {
        if (isMounted) setIsLoadingMessages(false);
      }
    };

    loadMessages();

    // Listen to real-time events on selected conversation
    if (socket) {
      const handleNewMessage = (newMsg: ChatMessage) => {
        if (!isMounted || newMsg.conversationId !== selectedConvId) return;

        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id || m.clientMessageId === newMsg.clientMessageId)) {
            return prev.map((m) =>
              m.clientMessageId === newMsg.clientMessageId ? newMsg : m
            );
          }
          return [...prev, newMsg];
        });

        // Mark as read immediately if admin has this chat open
        if (newMsg.senderRole === 'student') {
          emitMessageRead(selectedConvId);
        }

        setTimeout(() => scrollToBottom(true), 50);
      };

      const handleDelivered = ({ conversationId, messageIds }: any) => {
        if (!isMounted || conversationId !== selectedConvId) return;
        setMessages((prev) =>
          prev.map((m) =>
            messageIds.includes(m._id) && m.deliveryStatus === 'sent'
              ? { ...m, deliveryStatus: 'delivered' }
              : m
          )
        );
      };

      const handleRead = ({ conversationId }: any) => {
        if (!isMounted || conversationId !== selectedConvId) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.senderRole !== 'student' ? { ...m, deliveryStatus: 'read' } : m
          )
        );
      };

      const handleTypingStart = ({ conversationId, userName }: any) => {
        if (!isMounted || conversationId !== selectedConvId) return;
        setPeerTyping({ isTyping: true, userName });
        setTimeout(() => scrollToBottom(true), 50);
      };

      const handleTypingStop = ({ conversationId }: any) => {
        if (!isMounted || conversationId !== selectedConvId) return;
        setPeerTyping({ isTyping: false });
      };

      socket.on('message:new', handleNewMessage);
      socket.on('message:delivered', handleDelivered);
      socket.on('message:read', handleRead);
      socket.on('typing:start', handleTypingStart);
      socket.on('typing:stop', handleTypingStop);

      return () => {
        isMounted = false;
        socket.emit('conversation:leave', { conversationId: selectedConvId });
        socket.off('message:new', handleNewMessage);
        socket.off('message:delivered', handleDelivered);
        socket.off('message:read', handleRead);
        socket.off('typing:start', handleTypingStart);
        socket.off('typing:stop', handleTypingStop);
      };
    }
  }, [selectedConvId, scrollToBottom]);

  // Handle typing input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (!selectedConvId) return;

    emitTypingStart(selectedConvId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (selectedConvId) {
        emitTypingStop(selectedConvId);
      }
    }, 2000);
  };

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanMsg = inputText.trim();
    if (!cleanMsg || !selectedConvId || isSending) return;

    const clientMsgId = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const optimisticMsg: ChatMessage = {
      _id: `temp-${Date.now()}`,
      conversationId: selectedConvId,
      senderId: 'admin-self',
      senderRole: 'admin',
      senderName: 'Adv. Rajinder Sir',
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

    emitTypingStop(selectedConvId);

    try {
      const socket = socketRef.current;
      if (socket && socket.connected) {
        socket.emit(
          'message:send',
          {
            conversationId: selectedConvId,
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
        const res = await apiClient.get(`/chat/conversations/${selectedConvId}/messages?limit=50`);
        if (res.data?.messages) setMessages(res.data.messages);
        setIsSending(false);
      }
    } catch (err) {
      console.error('Failed to send admin message:', err);
      toast.error('Failed to send message.');
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedConversation = conversations.find((c) => c._id === selectedConvId);

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.studentName.toLowerCase().includes(q) ||
      c.studentRollNo.toLowerCase().includes(q) ||
      c.lastMessagePreview.toLowerCase().includes(q)
    );
  });

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
    <div className="grid grid-cols-1 lg:grid-cols-12 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] h-[720px] overflow-hidden shadow-2xl animate-in fade-in duration-200">
      {/* 1. Left Column: Student Conversations Directory (4 Cols) */}
      <div className="lg:col-span-4 border-r border-[#3D3D3D] flex flex-col h-full bg-[#181818]">
        {/* Directory Header */}
        <div className="p-4 border-b border-[#3D3D3D] space-y-3 bg-[#202020]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-serif font-bold text-[#F7F3E6] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#C19B48]" />
              <span>Student Mentorship Rooms</span>
            </h3>
            <button
              type="button"
              onClick={fetchConversations}
              disabled={isLoadingConvs}
              className="p-1.5 rounded-lg bg-[#262626] hover:bg-[#333333] border border-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] transition-colors cursor-pointer"
              title="Refresh conversations"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingConvs ? 'animate-spin text-[#C19B48]' : ''}`} />
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#A8A294] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student or roll no..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] placeholder:text-[#A8A294]/60 focus:outline-none focus:border-[#C19B48]"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#3D3D3D]/40">
          {isLoadingConvs ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-2 text-[#A8A294]">
              <Loader2 className="w-5 h-5 animate-spin text-[#C19B48]" />
              <span className="text-xs">Loading mentorship channels...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-[#A8A294] text-xs space-y-1">
              <p>No active student conversations found.</p>
              <p className="text-[11px] text-[#A8A294]/60">
                When students initiate chat from their portal, they will appear here.
              </p>
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = c._id === selectedConvId;
              const hasUnread = (c.unreadCountAdmin || 0) > 0;

              return (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => setSelectedConvId(c._id)}
                  className={`w-full text-left p-3.5 transition-all cursor-pointer flex items-start gap-3 border-l-4 ${
                    isSelected
                      ? 'bg-[#262626] border-[#C19B48]'
                      : 'hover:bg-[#202020] border-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#262626] to-[#3D3D3D] border border-[#3D3D3D] flex items-center justify-center font-bold text-xs text-[#C19B48]">
                      {c.studentName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#181818]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-semibold text-[#F7F3E6] truncate">
                        {c.studentName}
                      </h4>
                      <span className="text-[10px] text-[#A8A294] shrink-0 font-mono">
                        {formatTime(c.lastMessageAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <span className="text-[10px] text-[#C19B48] font-mono">
                        {c.studentRollNo}
                      </span>

                      {hasUnread && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#C19B48] text-[#1E1E1E]">
                          {c.unreadCountAdmin}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#A8A294] truncate mt-1">
                      {c.lastMessagePreview || 'Active conversation room'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right Column: Active Chat Stream & Canned Citations (8 Cols) */}
      <div className="lg:col-span-8 flex flex-col h-full bg-[#1E1E1E]">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-[#3D3D3D] bg-[#222222] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#262626] border border-[#C19B48]/30 flex items-center justify-center font-bold text-xs text-[#C19B48]">
                  {selectedConversation.studentName.slice(0, 2).toUpperCase()}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[#F7F3E6]">
                      {selectedConversation.studentName}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#C19B48]/15 text-[#C19B48] border border-[#C19B48]/30">
                      {selectedConversation.studentRollNo}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active in Judicial Mentorship Session</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CannedLegalResponses
                  onSelectResponse={(text) =>
                    setInputText((prev) => (prev ? `${prev}\n\n${text}` : text))
                  }
                />
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-[#1A1A1A]/80">
              {isLoadingMessages ? (
                <div className="flex flex-col items-center justify-center h-full space-y-2 text-[#A8A294]">
                  <Loader2 className="w-5 h-5 animate-spin text-[#C19B48]" />
                  <span className="text-xs">Decrypting discussion stream...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2 text-[#A8A294]">
                  <Scale className="w-8 h-8 text-[#C19B48] opacity-60" />
                  <p className="text-xs">No message history yet.</p>
                  <p className="text-[11px]">Send a mentor greeting or legal guidance below.</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const isStaff = msg.senderRole !== 'student';
                    return (
                      <div
                        key={msg._id || msg.clientMessageId}
                        className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'} space-y-1`}
                      >
                        <div
                          className={`max-w-[82%] sm:max-w-[70%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-md ${
                            isStaff
                              ? 'bg-[#2A2A2A] text-[#F7F3E6] border border-[#C19B48]/40'
                              : 'bg-[#222222] text-[#F7F3E6] border border-[#3D3D3D]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px] text-[#A8A294] mb-1">
                            <span className="font-semibold text-[#C19B48] flex items-center gap-1">
                              {isStaff && <Sparkles className="w-2.5 h-2.5" />}
                              <span>{msg.senderName} ({isStaff ? 'Faculty' : 'Student'})</span>
                            </span>
                            <span>{formatTime(msg.createdAt)}</span>
                          </div>

                          <p className="whitespace-pre-wrap font-sans">{msg.message}</p>

                          {/* Delivery Ticks for Faculty Messages */}
                          {isStaff && (
                            <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#A8A294]">
                              {msg.deliveryStatus === 'read' ? (
                                <span title="Read by Student (Double Gold Ticks)">
                                  <CheckCheck className="w-3.5 h-3.5 text-[#C19B48]" />
                                </span>
                              ) : msg.deliveryStatus === 'delivered' ? (
                                <span title="Delivered to Student Device (Double Grey Ticks)">
                                  <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                                </span>
                              ) : (
                                <span title="Sent to Server (Single Grey Tick)">
                                  <Check className="w-3.5 h-3.5 text-slate-400" />
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Student Typing Bubble */}
                  {peerTyping.isTyping && (
                    <div className="flex items-center gap-2 text-xs text-[#C19B48] p-2 rounded-xl bg-[#262626] w-fit border border-[#C19B48]/20 animate-pulse">
                      <span className="flex space-x-1">
                        <span className="w-1.5 h-1.5 bg-[#C19B48] rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-[#C19B48] rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-[#C19B48] rounded-full animate-bounce [animation-delay:0.4s]" />
                      </span>
                      <span className="text-[11px] font-medium">
                        {peerTyping.userName || 'Student'} is drafting query...
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 border-t border-[#3D3D3D] bg-[#202020] flex items-end gap-2"
            >
              <textarea
                rows={2}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type judicial reasoning, cite statutory provisions, or use Canned Citations above (Enter to send)..."
                className="flex-1 p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] placeholder:text-[#A8A294]/60 focus:outline-none focus:border-[#C19B48] resize-none max-h-36 min-h-[48px] leading-relaxed"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-3 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-lg"
                title="Send explanation"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#A8A294] p-8 text-center space-y-2">
            <Scale className="w-12 h-12 text-[#C19B48] opacity-60" />
            <h3 className="text-base font-serif font-bold text-[#F7F3E6]">
              Academic Mentorship Chamber
            </h3>
            <p className="text-xs max-w-sm">
              Select a student from the directory on the left to begin 1-to-1 mentoring.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
