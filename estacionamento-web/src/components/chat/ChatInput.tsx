import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
    onSend: (message: string) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        if (!message.trim()) return;
        onSend(message);
        setMessage('');

        // Reset height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent default newline
            handleSend();
        }
    };

    // Auto-resize textarea logic
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [message]);

    return (
        <div className="flex items-end gap-2 p-3 bg-gray-50 border-t border-gray-200">
            <div className="flex-1 bg-white border border-gray-300 rounded-[20px] shadow-sm relative overflow-hidden transition-all focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400">
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem..."
                    rows={1}
                    className="w-full resize-none bg-transparent py-2.5 px-4 pr-12 text-sm text-gray-800 outline-none max-h-[120px]"
                />
            </div>

            <button
                onClick={handleSend}
                disabled={!message.trim()}
                className={`p-2.5 rounded-full flex items-center justify-center transition-all flex-shrink-0
                ${message.trim()
                        ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-md shadow-blue-600/20'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
            >
                <Send size={18} className="translate-x-[1px] translate-y-[-1px]" />
            </button>
        </div>
    );
}
