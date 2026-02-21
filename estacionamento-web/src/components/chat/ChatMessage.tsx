import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';

interface Message {
    id: number;
    sender_role: 'admin' | 'porteiro';
    content: string;
    created_at: string;
}

interface ChatMessageProps {
    message: Message;
    isMe: boolean;
}

export function ChatMessage({ message, isMe }: ChatMessageProps) {
    const timeString = format(new Date(message.created_at), "HH:mm");

    return (
        <div className={`flex w-full mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`flex flex-col max-w-[85%] px-3 py-2 text-[13px] relative shadow-sm break-words
                ${isMe
                        ? 'bg-blue-600 text-white rounded-[16px] rounded-tr-[4px]'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-[16px] rounded-tl-[4px]'
                    }`}
            >
                {/* Sender Name - only show if it's not me */}
                {!isMe && (
                    <span className="font-bold text-[10px] text-blue-600 mb-0.5 opacity-90 tracking-wide uppercase">
                        {message.sender_role === 'admin' ? 'Administração' : 'Portaria'}
                    </span>
                )}

                {/* Message Content */}
                <span className="leading-snug pr-8 whitespace-pre-wrap">{message.content}</span>

                {/* Timestamp & Status (inside the bubble, bottom right) */}
                <span className={`text-[10px] absolute bottom-1 right-2 flex items-center gap-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                    {timeString}
                    {isMe && <CheckCheck size={12} />}
                </span>
            </div>
        </div>
    );
}
