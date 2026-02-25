import React, { useState, useEffect } from 'react';
import { Camera, X, History, Search, FileText, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useStorage } from '@/hooks/useStorage';
import { CameraAutoCapture } from '@/components/CameraAutoCapture';

interface ConsultaMotosModalProps {
    onClose: () => void;
}

export function ConsultaMotosModal({ onClose }: ConsultaMotosModalProps) {
    const { limparMotosAntigas, getTodasMotos, getHistoricoMotos, registrarEntradaMoto } = useStorage();
    const [activeTab, setActiveTab] = useState<'lista' | 'historico'>('lista');

    // Lista state
    const [motos, setMotos] = useState<any[]>([]);
    const [filteredMotos, setFilteredMotos] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Historico state
    const [historico, setHistorico] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        // Primeiro limpa as antigas (para não trazer no histórico)
        await limparMotosAntigas();

        const todas = await getTodasMotos();
        setMotos(todas);
        setFilteredMotos(todas);

        const hist = await getHistoricoMotos();
        setHistorico(hist);

        setLoading(false);
    };

    // Filter lista
    useEffect(() => {
        const lower = searchTerm.toLowerCase();
        const filtered = motos.filter(m =>
            (m.nome_responsavel && m.nome_responsavel.toLowerCase().includes(lower)) ||
            (m.moto_detalhes && m.moto_detalhes.toLowerCase().includes(lower)) ||
            (m.apartamento && String(m.apartamento).includes(lower)) ||
            (m.bloco && m.bloco.toLowerCase().includes(lower))
        );
        setFilteredMotos(filtered);
    }, [searchTerm, motos]);

    const handleTabChange = async (tab: 'lista' | 'historico') => {
        setActiveTab(tab);
        if (tab === 'historico') {
            const hist = await getHistoricoMotos();
            setHistorico(hist);
        }
    };

    const handleCapture = async (file: File | null, morador: any) => {
        if (!file) return;

        setProcessingId(morador.id);
        const success = await registrarEntradaMoto({
            morador_nome: morador.nome_responsavel,
            apartamento: morador.apartamento,
            bloco: morador.bloco,
            moto_detalhes: morador.moto_detalhes,
            fotoFile: file
        });

        if (success) {
            alert('Entrada da moto registrada com sucesso!');
        } else {
            alert('Erro ao registrar entrada da moto.');
        }
        setProcessingId(null);
    };

    const formatDate = (isoString: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const formatMotoLabel = (text: string) => {
        if (!text) return null;
        const plateRegex = /([a-zA-Z]{3}[-\s]?[0-9][0-9a-zA-Z][0-9]{2})/;
        const match = text.match(plateRegex);

        if (match) {
            const plate = match[0].toUpperCase();
            const restOfText = text.replace(plateRegex, '').replace(/^[,\s]+|[,\s]+$/g, '').replace(/[,\s]{2,}/g, ', ').trim();

            return (
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <span className="bg-gray-200 text-black px-2 py-0.5 rounded font-bold font-mono text-xs border border-gray-400 uppercase tracking-widest">{plate}</span>
                    <span className="text-gray-300 text-sm leading-tight line-clamp-2">{restOfText || "Moto não especificada"}</span>
                </div>
            );
        }

        return <span className="text-gray-300 text-sm leading-tight block mt-0.5 line-clamp-2">{text}</span>;
    };

    return (
        <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <Card className="w-full max-w-2xl bg-navy border-gold shadow-2xl flex flex-col h-[90vh] md:h-[80vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gold/30">
                    <h2 className="text-xl font-bold text-gold flex items-center gap-2">
                        <span className="bg-gold/20 p-2 rounded-lg">🏍️</span>
                        Controle de Motos
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700 bg-navy-light/50">
                    <button
                        onClick={() => handleTabChange('lista')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'lista' ? 'text-gold border-b-2 border-gold bg-gold/5' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <Search size={18} /> Consultar Motos
                    </button>
                    <button
                        onClick={() => handleTabChange('historico')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'historico' ? 'text-gold border-b-2 border-gold bg-gold/5' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        <History size={18} /> Histórico (3 Dias)
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center items-center h-full text-gold">
                            <span className="animate-spin text-3xl">⚙️</span>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'lista' && (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                                        <Input
                                            placeholder="Buscar por morador, moto, ap ou bloco..."
                                            className="pl-10 bg-navy-light border-gray-600 text-white placeholder-gray-400 focus:border-gold"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    {filteredMotos.length === 0 ? (
                                        <div className="text-center py-10 text-gray-400 bg-navy-light/30 rounded-lg border border-dashed border-gray-700">
                                            <p>Nenhuma moto encontrada.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3">
                                            {filteredMotos.map((m) => (
                                                <div key={m.id} className="bg-navy-light border border-gray-700 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-gold/50 transition-colors">
                                                    <div className="space-y-1 overflow-hidden flex-1 w-full">
                                                        <p className="font-bold text-white leading-tight truncate text-base sm:text-lg">{m.nome_responsavel}</p>
                                                        <div className="flex flex-col items-start gap-1">
                                                            <span className="bg-gray-800 px-2 py-0.5 rounded text-gold font-mono text-xs">{m.apartamento}-{m.bloco}</span>
                                                            {formatMotoLabel(m.moto_detalhes)}
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0 w-full sm:w-auto">
                                                        <CameraAutoCapture onCapture={(file) => handleCapture(file, m)}>
                                                            <Button
                                                                disabled={processingId === m.id}
                                                                className={`w-full sm:w-auto ${processingId === m.id ? 'bg-gray-600' : 'bg-gold hover:bg-gold-hover text-navy font-bold'}`}
                                                            >
                                                                {processingId === m.id ? 'Salvando...' : (
                                                                    <>
                                                                        <Camera size={18} className="mr-2" />
                                                                        Validar
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </CameraAutoCapture>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'historico' && (
                                <div className="space-y-4">
                                    <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg flex items-start gap-3">
                                        <Clock className="text-blue-400 shrink-0 mt-0.5" size={18} />
                                        <p className="text-sm text-blue-200">
                                            Este histórico exibe as validações recentes. Registros mais antigos que 3 dias são apagados automaticamente para economizar espaço.
                                        </p>
                                    </div>

                                    {historico.length === 0 ? (
                                        <div className="text-center py-10 text-gray-400 bg-navy-light/30 rounded-lg border border-dashed border-gray-700">
                                            <p>Nenhum histórico recente de motos.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            {historico.map((h) => (
                                                <div key={h.id} className="bg-navy-light border border-gray-700 rounded-xl overflow-hidden flex flex-col sm:flex-row shadow-sm">
                                                    {h.foto_url && (
                                                        <div className="h-48 sm:h-32 sm:w-32 shrink-0 bg-black relative">
                                                            <img
                                                                src={h.foto_url}
                                                                alt="Moto"
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="p-4 flex-1 flex flex-col justify-center">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-bold text-white text-lg">{h.morador_nome}</h4>
                                                            <span className="text-xs text-gray-400 flex items-center gap-1 bg-gray-800 px-2 py-1 rounded">
                                                                <Clock size={12} />
                                                                {formatDate(h.data_entrada)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="bg-gray-800 px-2 py-0.5 rounded text-gold text-xs font-mono">{h.apartamento}-{h.bloco}</span>
                                                        </div>
                                                        {formatMotoLabel(h.moto_detalhes)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}
