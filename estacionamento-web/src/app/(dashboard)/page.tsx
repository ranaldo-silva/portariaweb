"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStorage } from '@/hooks/useStorage';
import { differenceInHours, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, Bike, User as UserIcon, Package, Car, X, LogIn } from 'lucide-react';

import { DetailsModal } from '@/components/DetailsModal';

export default function Dashboard() {
    const router = useRouter();
    const { sincronizarMoradores, getVeiculos, removerVeiculo, getEncomendasAtivas } = useStorage();

    const [busca, setBusca] = useState('');
    const [moradores, setMoradores] = useState<any[]>([]);
    const [ativos, setAtivos] = useState<any[]>([]);
    const [encomendas, setEncomendas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [vagaSel, setVagaSel] = useState<any>(null);
    const [itemDetalhes, setItemDetalhes] = useState<any>(null); // New state for modal
    const [filtroMoto, setFiltroMoto] = useState(false);
    const [filtroBloco, setFiltroBloco] = useState(''); // '' = Todos

    const carregarDados = async () => {
        setLoading(true);
        try {
            const [m, v, e] = await Promise.all([
                sincronizarMoradores(),
                getVeiculos(),
                getEncomendasAtivas()
            ]);
            setMoradores(m || []);
            setAtivos(v || []);
            setEncomendas(e || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarDados(); }, []);

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

        // Deep search including Dependents (lista_moradores/dependentes)
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
                                onClick={() => setItemDetalhes(m)} // Open modal on click
                            >
                                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-bold", m.moto_detalhes ? "bg-gold text-black" : "bg-blue-900 text-white")}>
                                    {m.apartamento}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-white">{m.nome_responsavel} <span className="text-sm font-normal text-gray-400">({m.bloco})</span></h4>
                                    <p className="text-xs text-gray-400 line-clamp-2">
                                        {m.carro_detalhes} {m.moto_detalhes && `| 🏍️ ${m.moto_detalhes}`}
                                    </p>
                                    {/* Show matched dependent if pertinent? For now just showing details modal is enough */}
                                    {temEncomenda && <span className="text-xs font-bold text-gold flex items-center gap-1 mt-1"><Package size={12} /> TEM ENCOMENDA</span>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

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

            {/* MODAL VAGA (Simple Overlay) - Keeping strict control over this specific one */}
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

            {/* NEW DETAILS MODAL */}
            <DetailsModal
                isOpen={!!itemDetalhes}
                onClose={() => setItemDetalhes(null)}
                title={itemDetalhes?.nome_responsavel || "Detalhes"}
                data={itemDetalhes}
                type="morador"
            />
        </div>
    );
}
