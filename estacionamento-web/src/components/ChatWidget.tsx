"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { ChatHeader } from './chat/ChatHeader';
import { ChatDateSeparator } from './chat/ChatDateSeparator';
import { ChatMessage } from './chat/ChatMessage';
import { ChatInput } from './chat/ChatInput';

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
                const newMsg = payload.new as Message;
                setMessages((prev) => [...prev, newMsg]);

                // Auto-open if message is not from me
                if (newMsg.sender_role !== role) {
                    setIsOpen(true);
                    // Play notification sound (optional, simple beep)
                    // const audio = new Audio('/notification.mp3'); 
                    // audio.play().catch(e => console.log(e));
                }

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

    const handleSendMessage = async (textToSend: string) => {
        if (!textToSend.trim() || !role) return;

        const { error } = await supabase.from('chat_messages').insert([{
            sender_role: role,
            content: textToSend
        }]);

        if (error) console.error(error);
        else {
            // Trigger Notification if sender is Porteiro (Notify Admins)
            if (role === 'porteiro') {
                await fetch('/api/notifications/chat-broadcast', {
                    method: 'POST',
                    body: JSON.stringify({ message: textToSend })
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
                <Card className="w-80 sm:w-80 h-[450px] shadow-2xl flex flex-col animate-in slide-in-from-bottom-5 border-none rounded-[12px] bg-[#e5ddd5]">
                    {/* Header */}
                    <ChatHeader onClose={() => setIsOpen(false)} />

                    {/* Messages Area */}
                    <CardContent className="flex-1 p-0 flex flex-col overflow-hidden relative">
                        {/* Chat Background Pattern (Optional aesthetic touch) */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #000 1px, transparent 1px)', backgroundSize: '10px 10px' }} />

                        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 relative z-10 w-full scrollbar-thin scrollbar-thumb-gray-300">
                            {messages.map((msg, index) => {
                                const isMe = msg.sender_role === role;
                                const showDate = index === 0 ||
                                    new Date(msg.created_at).toDateString() !== new Date(messages[index - 1].created_at).toDateString();

                                return (
                                    <div key={msg.id} className="w-full flex flex-col">
                                        {showDate && <ChatDateSeparator dateString={msg.created_at} />}
                                        <ChatMessage message={msg} isMe={isMe} />
                                    </div>
                                );
                            })}
                            <div ref={scrollRef} className="h-1" />
                        </div>

                        {/* Input Area */}
                        <ChatInput onSend={handleSendMessage} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
