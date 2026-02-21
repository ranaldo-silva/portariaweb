import { MessageCircle, X } from 'lucide-react';

interface ChatHeaderProps {
    onClose: () => void;
}

export function ChatHeader({ onClose }: ChatHeaderProps) {
    return (
        <div className="p-3 bg-blue-600 text-white flex flex-row items-center justify-between rounded-t-[12px] shadow-sm relative z-10">
            <div className="flex items-center gap-2">
                <div className="relative">
                    <MessageCircle size={20} />
                    {/* Fake online indicator */}
                    <span className="absolute bottom-0 right-[-2px] w-2.5 h-2.5 bg-green-400 border border-blue-600 rounded-full"></span>
                </div>
                <div className="flex flex-col">
                    <h3 className="text-sm font-bold leading-none">Chat Interno</h3>
                    <span className="text-[10px] text-blue-200 mt-0.5">Portaria ↔ Administração</span>
                </div>
            </div>
            <button
                onClick={onClose}
                className="text-white hover:bg-blue-700/50 p-1.5 rounded-full transition-colors"
                title="Fechar Chat"
            >
                <X size={18} />
            </button>
        </div>
    );
}
