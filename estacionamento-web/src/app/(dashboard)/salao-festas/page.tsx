"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStorage } from '@/hooks/useStorage';
import { Search, PartyPopper, Calendar, Users, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DetailsModal } from '@/components/DetailsModal';

export default function SalaoFestas() {
    const { getEventosSalao } = useStorage();
    const [eventos, setEventos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [eventoSelecionado, setEventoSelecionado] = useState<any>(null);

    useEffect(() => {
        carregarEventos();
    }, []);

    const carregarEventos = async () => {
        setLoading(true);
        const data = await getEventosSalao();
        setEventos(data);
        setLoading(false);
    };

    const abrirLista = (evento: any) => {
        setEventoSelecionado({
            ...evento,
            morador_nome: evento.morador?.nome_responsavel,
            apartamento: evento.morador?.apartamento,
            bloco: evento.morador?.bloco
        });
        setModalOpen(true);
    };

    const eventosFiltrados = eventos.filter(ev => {
        const query = busca.toLowerCase();
        const nome = ev.morador?.nome_responsavel?.toLowerCase() || '';
        const dataEv = ev.data_evento || '';
        const blocoS = ev.bloco_salao?.toLowerCase() || '';
        return nome.includes(query) || dataEv.includes(query) || blocoS.includes(query);
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gold flex items-center gap-2">
                <PartyPopper className="text-pink-500" /> Salão de Festas
            </h1>

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Buscar por morador, bloco do salão ou data (YYYY-MM-DD)..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        className="pl-9 bg-navy text-white"
                    />
                </div>
                <Button onClick={carregarEventos} className="bg-gold text-navy hover:bg-yellow-500">Atualizar</Button>
            </div>

            {loading ? (
                <div className="text-white text-center p-8">Carregando eventos...</div>
            ) : eventosFiltrados.length === 0 ? (
                <div className="text-gray-400 text-center p-8 bg-navy/50 rounded-lg">Nenhum evento encontrado.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {eventosFiltrados.map(ev => (
                        <Card key={ev.id} className="bg-navy border-gold/30">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-lg text-gold flex items-center gap-2">
                                    <Calendar size={18} /> {new Date(ev.data_evento + 'T12:00:00Z').toLocaleDateString()}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-3">
                                <div>
                                    <p className="text-white font-bold">{ev.morador?.nome_responsavel || "Morador Desconhecido"}</p>
                                    <p className="text-sm text-gray-400">AP {ev.morador?.apartamento} - {ev.morador?.bloco}</p>
                                </div>
                                <div className="bg-navy-light p-2 rounded border border-gray-700">
                                    <p className="text-sm text-pink-400 font-bold flex items-center gap-1">
                                        <PartyPopper size={14} /> Salão Bloco {ev.bloco_salao}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full border-pink-500/50 text-pink-400 hover:bg-pink-900/30 font-bold"
                                    onClick={() => abrirLista(ev)}
                                >
                                    <Eye size={16} className="mr-2" /> Ver Lista de Convidados
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <DetailsModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Lista de Convidados"
                data={eventoSelecionado}
                type="salao"
                readOnly={true}
            />
        </div>
    );
}
