"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStorage } from '@/hooks/useStorage';
import { supabase } from '@/lib/supabase';
import { differenceInHours, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, Bike, User as UserIcon, Package, Car, X, LogIn, AlertTriangle } from 'lucide-react';

import { DetailsModal } from '@/components/DetailsModal';

export default function Dashboard() {
    const router = useRouter();
    const { sincronizarMoradores, getVeiculos, removerVeiculo, getEncomendasAtivas, getVisitas } = useStorage(); // Added getVisitas

    const [busca, setBusca] = useState('');
    const [moradores, setMoradores] = useState<any[]>([]);
    const [ativos, setAtivos] = useState<any[]>([]);
    const [encomendas, setEncomendas] = useState<any[]>([]);
    const [visitas, setVisitas] = useState<any[]>([]); // Added visits state
    const [loading, setLoading] = useState(false);
    const [vagaSel, setVagaSel] = useState<any>(null);
    const [itemDetalhes, setItemDetalhes] = useState<any>(null);
    const [tipoDetalhes, setTipoDetalhes] = useState<'morador' | 'visita'>('morador'); // Added type state
    const [filtroMoto, setFiltroMoto] = useState(false);
    const [filtroBloco, setFiltroBloco] = useState('');

    const [novoAlerta, setNovoAlerta] = useState<any>(null);

    const carregarDados = async () => {
        setLoading(true);
        try {
            const [m, v, e, vis] = await Promise.all([ // Added visits fetch
                sincronizarMoradores(),
                getVeiculos(),
                getEncomendasAtivas(),
                getVisitas()
            ]);
            setMoradores(m || []);
            setAtivos(v || []);
            setEncomendas(e || []);
            setVisitas(vis || []); // Set visits
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarDados();

        const channel = supabase
            .channel('alertas-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'alertas_comunidade' },
                (payload) => {
                    console.log('Novo Alerta Recebido:', payload);
                    setNovoAlerta(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const verificarExcesso = (dataEntrada: string) => {
        const horas = differenceInHours(new Date(), parseISO(dataEntrada));
        if (horas >= 48) return { excedeu: true, class: 'bg-red-700 border-white border-2', mensagem: `⚠️ ${horas}h (Excedeu 48h)` };
        if (horas >= 24) return { excedeu: false, class: 'bg-indigo-900 border-red-500 border', mensagem: `🕒 ${horas}h estacionado` };
        return { excedeu: false, class: 'bg-navy-light border-success border', mensagem: `✅ ${horas}h` };
    };

    const toggleBloco = () => {
        const blocos = ['', 'A', 'B', 'C', 'D'];
        const atual = blocos.indexOf(filtroBloco);
        const proximo = (atual + 1) % blocos.length;
        setFiltroBloco(blocos[proximo]);
    };

    const filtrados = moradores.filter(m => {
        if (filtroBloco && String(m.bloco).toUpperCase().trim() !== filtroBloco) return false;
        if (filtroMoto && !m.moto_detalhes) return false;
        const termo = busca.toLowerCase().trim();
        if (termo === "" && !filtroMoto && !filtroBloco) return false;
        if (termo === "") return true;

        const dependentes = String(m.lista_moradores || m.lista_morador || m.dependentes || "");
        const campos = [
            m.nome_responsavel,
            m.carro_detalhes,
            m.moto_detalhes,
            dependentes,
            m.bloco,
            m.apartamento
        ];
        return campos.some(c => String(c || "").toLowerCase().includes(termo));
    });

    return (
        <div className="space-y-6">
            {/* Actions Bar */}
            <Card className="sticky top-0 z-30 shadow-xl bg-navy/95 backdrop-blur border-b border-gold/20 rounded-none -mx-4 md:rounded-lg md:mx-0">
                <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center">
                    <div className="relative flex-1 w-full text-black">
                        <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="Pesquisar morador, carro, AP..."
                            className="pl-9 bg-navy-light border-gold/30 text-white placeholder:text-gray-400"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <Button
                            variant={filtroBloco ? "default" : "outline"}
                            onClick={toggleBloco}
                            className="flex-1"
                        >
                            {filtroBloco ? `BLOCO ${filtroBloco}` : "BLOCO"}
                        </Button>

                        <Button
                            variant={filtroMoto ? "default" : "outline"}
                            size="icon"
                            onClick={() => setFiltroMoto(!filtroMoto)}
                            className={filtroMoto ? "bg-white text-navy" : ""}
                        >
                            <Bike size={20} />
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => router.push('/encomendas')}
                            className="relative"
                        >
                            <Package size={20} />
                            {encomendas.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                    {encomendas.length}
                                </span>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Search Results */}
            {(filtrados.length > 0) && (
                <div className="bg-navy-light rounded-lg border border-gold/30 p-2 max-h-60 overflow-y-auto">
                    <h3 className="text-gold font-bold px-2 py-1 sticky top-0 bg-navy-light">Resultados da Busca</h3>
                    {filtrados.map(m => {
                        const temEncomenda = encomendas.some(enc => enc.morador_id === m.id);
                        return (
                            <div
                                key={m.id}
                                className="flex items-start gap-3 p-3 border-b border-gray-700 last:border-0 hover:bg-navy/50 cursor-pointer"
                                onClick={() => { setItemDetalhes(m); setTipoDetalhes('morador'); }}
                            >
                                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-bold", m.moto_detalhes ? "bg-gold text-black" : "bg-blue-900 text-white")}>
                                    {m.apartamento}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-white">{m.nome_responsavel} <span className="text-sm font-normal text-gray-400">({m.bloco})</span></h4>
                                    <p className="text-xs text-gray-400 line-clamp-2">
                                        {m.carro_detalhes} {m.moto_detalhes && `| 🏍️ ${m.moto_detalhes}`}
                                    </p>
                                    {temEncomenda && <span className="text-xs font-bold text-gold flex items-center gap-1 mt-1"><Package size={12} /> TEM ENCOMENDA</span>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* VISIT HISTORY (New Section) */}
            <div className="bg-navy-light rounded-lg border border-gold/30 p-4">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-gold font-bold flex items-center gap-2"><UserIcon size={16} /> Últimas Visitas</h3>
                    <Button variant="link" size="sm" onClick={() => router.push('/visitas')} className="text-gray-400 text-xs">Ver Todas</Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {visitas.slice(0, 5).map(v => (
                        <div
                            key={v.id}
                            className="flex items-center gap-3 p-2 bg-navy border border-gray-700 rounded cursor-pointer hover:bg-navy/80"
                            onClick={() => { setItemDetalhes(v); setTipoDetalhes('visita'); }}
                        >
                            {v.foto_url ? (
                                <img src={v.foto_url} className="w-10 h-10 rounded-full object-cover border border-gold" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-navy-light flex items-center justify-center border border-gold">
                                    <UserIcon size={16} className="text-gold" />
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="font-bold text-white text-sm">{v.visitante_nome}</p>
                                <p className="text-xs text-gray-400">AP {v.apartamento} {v.bloco} • {new Date(v.data_visita).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    ))}
                    {visitas.length === 0 && <p className="text-gray-500 text-sm text-center py-2">Nenhuma visita recente.</p>}
                </div>
            </div>

            {/* MAP GRID */}
            <div>
                <h2 className="text-gold font-bold mb-4 tracking-widest text-center md:text-left">MAPA DE VAGAS (1-100)</h2>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                    {Array.from({ length: 100 }, (_, i) => i + 1).map(num => {
                        const ocupada = ativos.find(v => Number(v.vaga) === num);
                        const status = ocupada ? verificarExcesso(ocupada.dataEntrada) : null;

                        return (
                            <div
                                key={num}
                                onClick={() => ocupada ? setVagaSel(ocupada) : router.push(`/veiculos/novo?vaga=${num}`)}
                                className={cn(
                                    "aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 shadow-md",
                                    ocupada ? status?.class : "bg-navy-light border border-success/30 hover:border-success"
                                )}
                            >
                                <span className="text-lg font-bold text-white">{num}</span>
                                {ocupada && (
                                    <div className="mt-1 px-1.5 py-0.5 bg-gold rounded text-[10px] font-bold text-black truncate max-w-[90%]">
                                        {ocupada.placa}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* MODAL VAGA (Simple Overlay) */}
            {vagaSel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <Card className="w-full max-w-md bg-navy border-gold shadow-2xl">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                <h2 className="text-2xl font-bold text-gold">Vaga {vagaSel.vaga}</h2>
                                <Button variant="ghost" size="icon" onClick={() => setVagaSel(null)}><X className="text-white" /></Button>
                            </div>

                            <div className={cn("p-3 rounded text-center font-bold text-white", verificarExcesso(vagaSel.dataEntrada).class.split(' ')[0])}>
                                {verificarExcesso(vagaSel.dataEntrada).mensagem}
                            </div>

                            <div className="space-y-2 text-white">
                                <p><strong className="text-gold">Morador:</strong> {vagaSel.proprietario}</p>
                                <p><strong className="text-gold">Veículo:</strong> {vagaSel.veiculo_nome}</p>
                                <p><strong className="text-gold">Placa:</strong> {vagaSel.placa}</p>
                                <p><strong className="text-gold">Local:</strong> AP {vagaSel.apartamento} - {vagaSel.bloco}</p>
                                <p><strong className="text-gold">Entrada:</strong> {new Date(vagaSel.dataEntrada).toLocaleString('pt-BR')}</p>
                            </div>

                            <Button
                                variant="destructive"
                                className="w-full font-bold text-white"
                                onClick={async () => {
                                    if (confirm("Confirmar saída do veículo?")) {
                                        await removerVeiculo(vagaSel);
                                        setVagaSel(null);
                                        carregarDados();
                                    }
                                }}
                            >
                                REGISTRAR SAÍDA
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* DETAILS MODAL - Connected to both Morador and Visita */}
            <DetailsModal
                isOpen={!!itemDetalhes}
                onClose={() => setItemDetalhes(null)}
                title={tipoDetalhes === 'visita' ? 'Detalhes da Visita' : (itemDetalhes?.nome_responsavel || "Detalhes")}
                data={itemDetalhes}
                type={tipoDetalhes}
            />

            {/* REALTIME ALERT MODAL */}
            {novoAlerta && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur p-4 animate-in theme-red">
                    <Card className="w-full max-w-2xl bg-red-900 border-4 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)] animate-pulse">
                        <CardHeader className="text-center border-b border-red-500/50 pb-6">
                            <div className="flex justify-center mb-4">
                                <AlertTriangle size={80} className="text-white animate-bounce" />
                            </div>
                            <CardTitle className="text-4xl font-black text-white uppercase tracking-widest">
                                {novoAlerta.titulo}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 text-center space-y-6">
                            <div className="bg-black/40 p-6 rounded-xl border border-red-500/30">
                                <p className="text-2xl text-white font-bold leading-relaxed">
                                    {novoAlerta.descricao}
                                </p>
                            </div>

                            <div className="flex justify-center flex-col items-center gap-2">
                                <p className="text-red-200 font-mono text-sm">
                                    {new Date(novoAlerta.data_hora).toLocaleString()} - {novoAlerta.autor}
                                </p>
                                <p className="text-xs text-red-300">Este alerta foi emitido em tempo real</p>
                            </div>

                            <Button
                                size="lg"
                                className="w-full h-16 text-xl font-bold bg-white text-red-900 hover:bg-gray-200 hover:scale-105 transition-all"
                                onClick={() => setNovoAlerta(null)}
                            >
                                CIENTE, FECHAR ALERTA
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
