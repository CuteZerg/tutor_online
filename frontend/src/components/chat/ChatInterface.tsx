'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { api, getApiUrl } from '@/lib/api';
import { Send, Image as ImageIcon, Paperclip, Code, X, Loader2, Check, CheckCheck, MessageCircle } from 'lucide-react';
import CodeEditor from '@/components/editor/CodeEditor';
import Cookies from 'js-cookie';

const API_URL = getApiUrl();

interface Contact {
  id: number;
  full_name: string;
  email: string;
  role: string;
  unread_count: number;
  last_message?: Message;
}

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content?: string;
  attachment_url?: string;
  code_snippet?: string;
  is_read: boolean;
  created_at: string;
}

export default function ChatInterface() {
  const { user } = useAuthStore();
  const { lastEvent, fetchUnreadTotal } = useChatStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Media / Code attachment state
  const [isUploading, setIsUploading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [composingCode, setComposingCode] = useState(false);
  const [codeContent, setCodeContent] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch contacts
  const fetchContacts = async () => {
    try {
      const res = await api.get('/chat/contacts');
      setContacts(res.data);
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    }
  };

  // Fetch messages for selected contact
  const fetchMessages = async (contactId: number) => {
    try {
      const res = await api.get(`/chat/messages/${contactId}`);
      setMessages(res.data);
      scrollToBottom();
      
      // Update unread count locally and globally
      setContacts(prev => prev.map(c => c.id === contactId ? { ...c, unread_count: 0 } : c));
      fetchUnreadTotal();
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  // Initialize Data
  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
    }
  }, [selectedContact]);

  // Handle Events from DashboardLayout WS
  useEffect(() => {
    if (!lastEvent) return;
    
    if (lastEvent.type === 'CHAT_MESSAGE') {
      const senderId = lastEvent.payload.senderId;
      if (selectedContact && selectedContact.id === senderId) {
        fetchMessages(senderId); // refresh messages if currently chatting
      }
      fetchContacts(); // Always update list to get fresh last_message and unread counts
    } else if (lastEvent.type === 'CHAT_READ') {
      const readerId = lastEvent.payload.readerId;
      if (selectedContact && selectedContact.id === readerId) {
        setMessages(prev => prev.map(m => (!m.is_read && m.sender_id === user?.id) ? { ...m, is_read: true } : m));
      }
      fetchContacts(); // Update contacts list to reflect new read status in preview
    }
  }, [lastEvent, selectedContact, user?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle Send Message
  const handleSendMessage = async () => {
    if (!selectedContact) return;
    if (!newMessage.trim() && !attachedImage && (!composingCode || !codeContent.trim())) return;

    try {
      const payload = {
        receiver_id: selectedContact.id,
        content: newMessage.trim() || undefined,
        attachment_url: attachedImage || undefined,
        code_snippet: composingCode ? codeContent : undefined
      };

      const res = await api.post('/chat/messages', payload);
      setMessages(prev => [...prev, res.data]);
      
      // Reset state
      setNewMessage('');
      setAttachedImage(null);
      setComposingCode(false);
      setCodeContent('');
      scrollToBottom();
      fetchContacts();
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  // Handle Enter Key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Handle File Upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Только изображения поддерживаются в данный момент.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (selectedContact) {
      formData.append('shared_with_id', selectedContact.id.toString());
    }

    try {
      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAttachedImage(res.data.url);
    } catch (err) {
      console.error('Failed to upload', err);
      alert('Ошибка при загрузке файла');
    } finally {
      setIsUploading(false);
    }
  }, [selectedContact]);

  // Handle File Picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Handle Clipboard Paste
  const handlePaste = useCallback((e: globalThis.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleFileUpload(file);
        }
        break;
      }
    }
  }, [handleFileUpload]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl backdrop-blur-sm">
      {/* Sidebar: Contacts */}
      <div className="w-80 flex flex-col border-r border-slate-800 bg-slate-950/40">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-slate-100">Контакты</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map(contact => (
            <div 
              key={contact.id}
              onClick={() => setSelectedContact(contact)}
              className={`p-4 border-b border-slate-800/50 cursor-pointer transition-all duration-200 flex items-center gap-4 ${
                selectedContact?.id === contact.id ? 'bg-indigo-600/20 border-l-2 border-l-indigo-500' : 'hover:bg-slate-800/30 border-l-2 border-l-transparent'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-300 font-bold shadow-inner relative">
                {contact.full_name.charAt(0)}
                {contact.unread_count > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-[10px] flex items-center justify-center font-bold text-white shadow-lg shadow-rose-500/30">
                    {contact.unread_count}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-sm font-semibold text-slate-200 truncate">{contact.full_name}</h3>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {contact.last_message ? (
                    contact.last_message.content || (contact.last_message.attachment_url ? '📷 Фото' : '💻 Код')
                  ) : 'Нет сообщений'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {selectedContact ? (
          <>
            {/* Header */}
            <div className="h-20 border-b border-slate-800 flex items-center px-8 bg-slate-950/40 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                  {selectedContact.full_name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-slate-100 font-bold">{selectedContact.full_name}</h2>
                  <p className="text-xs text-slate-400 capitalize">{selectedContact.role === 'tutor' ? 'Преподаватель' : 'Ученик'}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar">
              {(() => {
                const groupedMessages = messages.reduce((acc: Record<string, Message[]>, msg) => {
                  const dateStr = new Date(msg.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
                  if (!acc[dateStr]) acc[dateStr] = [];
                  acc[dateStr].push(msg);
                  return acc;
                }, {});

                return Object.entries(groupedMessages).map(([date, dateMessages]) => (
                  <React.Fragment key={date}>
                    <div className="flex justify-center my-2">
                      <span className="text-xs font-medium bg-slate-800/80 text-slate-400 px-3 py-1 rounded-full border border-slate-700/50 backdrop-blur-sm">
                        {date}
                      </span>
                    </div>
                    {dateMessages.map(msg => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-2xl ${
                            isMe 
                              ? 'bg-indigo-600/20 border border-indigo-500/20 text-slate-200 rounded-tr-sm' 
                              : 'bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-tl-sm'
                          } overflow-hidden shadow-sm`}
                          >
                            {msg.attachment_url && (
                              <div className="p-2">
                                <a href={`${API_URL}${msg.attachment_url}?token=${Cookies.get('access_token')}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer block relative group">
                                  <img 
                                    src={`${API_URL}${msg.attachment_url}?token=${Cookies.get('access_token')}`} 
                                    alt="Attachment" 
                                    className="rounded-xl max-w-full h-auto object-cover max-h-[300px] transition-transform group-hover:opacity-90"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl">
                                    <span className="bg-slate-900/80 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm font-medium">
                                      Открыть оригинал
                                    </span>
                                  </div>
                                </a>
                              </div>
                            )}
                            
                            {msg.code_snippet && (
                              <div className="p-3 w-[600px] max-w-full h-[400px]">
                                <CodeEditor initialCode={msg.code_snippet} readOnly={false} />
                              </div>
                            )}

                            {msg.content && (
                              <div className="px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                                {msg.content}
                              </div>
                            )}
                            
                            <div className={`px-5 py-2 text-[10px] font-medium flex items-center gap-1 ${isMe ? 'text-indigo-400/60 justify-end' : 'text-slate-500 justify-start'}`}>
                              {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false })}
                              {isMe && (
                                msg.is_read ? <CheckCheck size={12} className="text-indigo-400" /> : <Check size={12} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ));
              })()}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose Area */}
            <div className="p-6 bg-slate-950/60 border-t border-slate-800 backdrop-blur-xl">
              {/* Attachment Previews */}
              {(attachedImage || composingCode) && (
                <div className="mb-4 flex gap-4">
                  {attachedImage && (
                    <div className="relative group">
                      <img src={`${API_URL}${attachedImage}?token=${Cookies.get('access_token')}`} className="h-20 rounded-lg border border-slate-700" alt="Preview" />
                      <button 
                        onClick={() => setAttachedImage(null)}
                        className="absolute -top-2 -right-2 bg-slate-800 text-rose-400 rounded-full p-1 border border-slate-700 hover:scale-110 transition-transform"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                  {composingCode && (
                    <div className="relative w-full h-[300px] border border-indigo-500/30 rounded-xl overflow-hidden shadow-lg shadow-indigo-500/5">
                      <CodeEditor 
                        initialCode={codeContent || '# Вставьте ваш код сюда\n\n'} 
                        onCodeChange={setCodeContent} 
                      />
                      <button 
                        onClick={() => { setComposingCode(false); setCodeContent(''); }}
                        className="absolute top-4 right-4 bg-slate-800 text-rose-400 rounded-full p-1 border border-slate-700 hover:scale-110 transition-transform z-10"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all"
                  title="Прикрепить фото (можно также использовать Ctrl+V)"
                >
                  <ImageIcon size={20} />
                </button>

                <button 
                  onClick={() => setComposingCode(true)}
                  className="p-3 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all"
                  title="Прикрепить Python код"
                >
                  <Code size={20} />
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Написать сообщение... (Ctrl+V для вставки картинки)"
                    className="w-full bg-slate-900 border border-slate-700/50 rounded-xl pl-5 pr-12 py-3 text-slate-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 placeholder:text-slate-500 shadow-inner"
                  />
                  {isUploading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400">
                      <Loader2 size={16} className="animate-spin" />
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleSendMessage}
                  disabled={isUploading || (!newMessage.trim() && !attachedImage && (!composingCode || !codeContent.trim()))}
                  className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center">
              <MessageCircle size={32} className="text-slate-600" />
            </div>
            <p>Выберите контакт для начала общения</p>
          </div>
        )}
      </div>
    </div>
  );
}
