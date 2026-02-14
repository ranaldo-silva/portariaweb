"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send } from 'lucide-react';

interface Message {
    id: number;
    sender_role: 'admin' | 'porteiro';
    content: string;
    created_at: string;
}

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [role, setRole] = useState<'admin' | 'porteiro' | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Identify Role
        const storedRole = localStorage.getItem('userRole');
        if (storedRole === 'admin') setRole('admin');
        else if (storedRole === 'porteiro') setRole('porteiro');
        else setRole(null); // Residents don't see chat

        // Load initial messages
        fetchMessages();

        // Subscribe to Realtime
        const channel = supabase
            .channel('chat_room')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
                setMessages((prev) => [...prev, payload.new as Message]);
                // Scroll to bottom on new message
                setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchMessages = async () => {
        const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .order('created_at', { ascending: true })
            .limit(50);

        if (data) setMessages(data);
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !role) return;

        const { error } = await supabase.from('chat_messages').insert([{
            sender_role: role,
            content: newMessage
        }]);

        if (error) console.error(error);
        else {
            setNewMessage('');
            // Trigger Notification if sender is Porteiro (Notify Admins)
            if (role === 'porteiro') {
                await fetch('/api/notifications/chat-broadcast', {
                    method: 'POST',
                    body: JSON.stringify({ message: newMessage })
                });
            }
        }
    };

    // Auto-scroll
    useEffect(() => {
        if (isOpen) {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    if (!role) return null; // Don't show for residents

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {!isOpen && (
                <Button
                    className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center"
                    onClick={() => setIsOpen(true)}
                >
                    <MessageCircle size={28} />
                    {/* Optional: Badge for unread */}
                </Button>
            )}

            {isOpen && (
                <Card className="w-80 h-96 shadow-2xl flex flex-col animate-in slide-in-from-bottom-10">
                    <CardHeader className="p-3 bg-blue-600 text-white flex flex-row items-center justify-between rounded-t-lg">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <MessageCircle size={18} /> Chat Portaria &lt;-&gt; ADM
                        </CardTitle>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
                            <X size={18} />
                        </button>
                    </CardHeader>
                    <CardContent className="flex-1 p-3 flex flex-col gap-2 overflow-hidden bg-white">
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {messages.map((msg) => {
                                const isMe = msg.sender_role === role;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-2 rounded-lg text-xs ${isMe
                                                ? 'bg-blue-100 text-blue-900 rounded-tr-none'
                                                : 'bg-gray-100 text-gray-900 rounded-tl-none'
                                            }`}>
                                            <p className="font-bold text-[10px] opacity-70 mb-1">
                                                {msg.sender_role === 'admin' ? 'Administração' : 'Portaria'}
                                            </p>
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={scrollRef} />
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                            <Input
                                className="h-9 text-xs"
                                placeholder="Digite sua mensagem..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                            <Button size="icon" className="h-9 w-9 bg-blue-600" onClick={handleSendMessage}>
                                <Send size={16} />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
