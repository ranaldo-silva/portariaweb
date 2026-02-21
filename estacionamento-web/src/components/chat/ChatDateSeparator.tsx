import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatDateSeparatorProps {
    dateString: string;
}

export function ChatDateSeparator({ dateString }: ChatDateSeparatorProps) {
    const date = new Date(dateString);
    let label = '';

    if (isToday(date)) {
        label = 'Hoje';
    } else if (isYesterday(date)) {
        label = 'Ontem';
    } else {
        label = format(date, "dd 'de' MMMM", { locale: ptBR });
    }

    return (
        <div className="flex items-center justify-center my-4 group">
            <div className="h-[1px] bg-gray-200 flex-1"></div>
            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-full shadow-sm mx-2 uppercase tracking-wide">
                {label}
            </span>
            <div className="h-[1px] bg-gray-200 flex-1"></div>
        </div>
    );
}
