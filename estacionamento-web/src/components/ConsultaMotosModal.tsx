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

    // New Flow State
    const [step, setStep] = useState<1 | 2>(1);
    const [inAp, setInAp] = useState('');
    const [inBloco, setInBloco] = useState('');
    const [inPlaca, setInPlaca] = useState('');
    const [inNomeDono, setInNomeDono] = useState('');

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
        if (tab === 'lista') {
            setStep(1); // Reset to step 1 when going back to lista
        }
        if (tab === 'historico') {
            const hist = await getHistoricoMotos();
            setHistorico(hist);
        }
    };

    const handleSearchClick = () => {
        if (!inAp) {
            alert('Por favor, informe o Apartamento.');
            return;
        }

        // Filter based on input
        const filtered = motos.filter(m => {
            const matchAp = String(m.apartamento) === inAp.trim();
            const matchBloco = inBloco.trim() === '' || (m.bloco || '').toLowerCase() === inBloco.trim().toLowerCase();
            return matchAp && matchBloco;
        });

        setFilteredMotos(filtered);
        setStep(2);
    };

    const handleCaptureNovo = async (file: File | null) => {
        if (!inPlaca.trim()) {
            alert('A placa da moto é obrigatória para registrar um pendente.');
            return;
        }
        if (!inNomeDono.trim()) {
            alert('O nome do dono da moto é obrigatório para registrar um pendente.');
            return;
        }

        setProcessingId(-1); // Special ID for "Novo"
        const success = await registrarEntradaMoto({
            morador_nome: "Pendente de Cadastro",
            apartamento: inAp.trim(),
            bloco: inBloco.trim().toUpperCase(),
            moto_detalhes: inPlaca.trim() ? `DESCONHECIDA | ${inPlaca.trim().toUpperCase()}` : "Moto Desconhecida",
            fotoFile: file,
            isPendente: true,
            novoNomeDono: inNomeDono.trim()
        });

        if (success) {
            alert('Entrada da moto registrada como Pendente!');
            setStep(1);
            setInAp('');
            setInBloco('');
            setInPlaca('');
            setInNomeDono('');
        } else {
            alert('Erro ao registrar entrada da moto.');
        }
        setProcessingId(null);
    };

    const handleCapture = async (file: File | null, morador: any) => {
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
                                    {step === 1 ? (
                                        <div className="bg-navy-light border border-gold/40 p-6 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-4">
                                            <h3 className="text-xl text-gold font-bold mb-4 text-center">Identificação da Moto</h3>
                                            <p className="text-gray-400 text-sm text-center mb-6">Por favor, questione o condutor sobre o seu destino antes de abrir o portão.</p>

                                            <div className="space-y-4 max-w-sm mx-auto">
                                                <div className="space-y-2">
                                                    <label className="text-sm text-gold font-bold">Unidade (AP) <span className="text-red-500">*</span></label>
                                                    <Input
                                                        placeholder="Ex: 101"
                                                        className="bg-navy border-gray-600 focus:border-gold text-white"
                                                        value={inAp}
                                                        onChange={(e) => setInAp(e.target.value)}
                                                        type="number"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm text-gold font-bold">Bloco (Opcional se não houver)</label>
                                                    <Input
                                                        placeholder="Ex: A"
                                                        className="bg-navy border-gray-600 focus:border-gold text-white uppercase"
                                                        value={inBloco}
                                                        onChange={(e) => setInBloco(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm text-gold font-bold">Placa da Moto <span className="text-red-500">*</span></label>
                                                    <Input
                                                        placeholder="Ex: ABC-1234"
                                                        className="bg-navy border-gray-600 focus:border-gold text-white uppercase"
                                                        value={inPlaca}
                                                        onChange={(e) => setInPlaca(e.target.value)}
                                                    />
                                                </div>

                                                <Button
                                                    onClick={handleSearchClick}
                                                    className="w-full bg-gold hover:bg-gold-hover text-navy font-bold mt-4"
                                                    size="lg"
                                                >
                                                    <Search size={18} className="mr-2" /> Avançar
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="animate-in fade-in">
                                            <button
                                                onClick={() => setStep(1)}
                                                className="mb-4 text-gray-400 hover:text-white flex items-center gap-1 text-sm font-bold bg-white/5 py-1 px-3 rounded-full"
                                            >
                                                ← Voltar para Busca
                                            </button>

                                            <h3 className="text-lg text-white font-bold mb-3">
                                                Resultado para AP {inAp} {inBloco ? `- Bloco ${inBloco}` : ''}
                                            </h3>

                                            {filteredMotos.length === 0 ? (
                                                <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 text-center space-y-4">
                                                    <div className="text-red-400 font-bold text-lg">⚠️ Nenhuma moto cadastrada para esta unidade.</div>
                                                    <p className="text-gray-300 text-sm">Se tiver certeza da entrada, preencha o nome do condutor e registre com foto. A moto será vinculada à unidade.</p>

                                                    <div className="space-y-2 mt-4 text-left">
                                                        <label className="text-sm text-gold font-bold">Nome do Condutor da Moto <span className="text-red-500">*</span></label>
                                                        <Input
                                                            placeholder="Ex: João Silva"
                                                            className="bg-navy-light text-white border-gray-600 focus:border-gold"
                                                            value={inNomeDono}
                                                            onChange={(e) => setInNomeDono(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="flex justify-center flex-col sm:flex-row gap-3 mt-4">
                                                        <CameraAutoCapture onCapture={handleCaptureNovo}>
                                                            <Button
                                                                disabled={processingId === -1 || !inPlaca.trim() || !inNomeDono.trim()}
                                                                className={`w-full sm:w-auto ${processingId === -1 ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-700 text-white font-bold'}`}
                                                            >
                                                                {processingId === -1 ? 'Salvando...' : (
                                                                    <>
                                                                        <Camera size={18} className="mr-2" />
                                                                        Registrar Pendente c/ Foto
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </CameraAutoCapture>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid gap-3">
                                                    {filteredMotos.map((m) => (
                                                        <div key={m.id} className="bg-navy-light border border-green-500/30 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-green-500 transition-colors">
                                                            <div className="space-y-1 overflow-hidden flex-1 w-full">
                                                                <div className="flex items-center gap-2">
                                                                    <CheckCircle size={16} className="text-green-500" />
                                                                    <p className="font-bold text-white leading-tight truncate text-base sm:text-lg">{m.nome_responsavel}</p>
                                                                </div>
                                                                <div className="flex flex-col items-start gap-1 ml-6">
                                                                    <span className="bg-gray-800 px-2 py-0.5 rounded text-gold font-mono text-xs">{m.apartamento}-{m.bloco}</span>
                                                                    {formatMotoLabel(m.moto_detalhes)}
                                                                </div>
                                                            </div>

                                                            <div className="shrink-0 w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    disabled={processingId === m.id}
                                                                    onClick={(e) => { e.stopPropagation(); handleCapture(null, m); }}
                                                                    className="w-full sm:w-auto border-gold/50 text-gold hover:bg-gold/10 font-bold"
                                                                >
                                                                    Entrada S/ Foto
                                                                </Button>
                                                                <CameraAutoCapture onCapture={(file) => handleCapture(file, m)}>
                                                                    <Button
                                                                        disabled={processingId === m.id}
                                                                        className={`w-full sm:w-auto ${processingId === m.id ? 'bg-gray-600' : 'bg-gold hover:bg-gold-hover text-navy font-bold'}`}
                                                                    >
                                                                        {processingId === m.id ? 'Salvando...' : (
                                                                            <>
                                                                                <Camera size={18} className="mr-2" />
                                                                                Validar Moto
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                </CameraAutoCapture>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    <div className="mt-6 pt-6 border-t border-gray-700 text-center space-y-3">
                                                        <p className="text-sm text-gray-400">A moto é diferente ou de um visitante?</p>
                                                        <CameraAutoCapture onCapture={handleCaptureNovo}>
                                                            <Button
                                                                disabled={processingId === -1}
                                                                variant="outline"
                                                                className="border-gray-500 text-gray-300 hover:bg-white/5 text-sm h-8"
                                                            >
                                                                <Camera size={14} className="mr-2" />
                                                                Registrar como Pendente
                                                            </Button>
                                                        </CameraAutoCapture>
                                                    </div>
                                                </div>
                                            )}
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
