"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStorage } from "@/hooks/useStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Trash2, ArrowLeft, PartyPopper } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function MoradorSalaoFestas() {
    const router = useRouter();
    const { getEventosPorMorador, registrarEventoSalao, removerEventoSalao } = useStorage();

    const [eventos, setEventos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [morador, setMorador] = useState<any>(null);

    const [novaData, setNovaData] = useState("");
    const [novoBloco, setNovoBloco] = useState("");
    const [novaLista, setNovaLista] = useState("");
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        const id = localStorage.getItem("morador_session_id");
        if (!id) {
            router.push("/morador/login");
            return;
        }
        carregarDados(Number(id));
    }, []);

    const carregarDados = async (id: number) => {
        setLoading(true);
        // Load Resident Profile
        const { data: m } = await supabase.from('moradores').select('*').eq('id', id).single();
        if (m) {
            setMorador(m);
            // Load their parties
            const ev = await getEventosPorMorador(id);
            setEventos(ev || []);
        }
        setLoading(false);
    };

    const handleSalvar = async () => {
        if (!novaData || !novoBloco || !novaLista.trim()) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }
        setSalvando(true);
        const sucesso = await registrarEventoSalao({
            morador_id: morador.id,
            apartamento: morador.apartamento,
            bloco: morador.bloco,
            bloco_salao: novoBloco,
            data_evento: novaData,
            lista_convidados: novaLista
        });

        if (sucesso) {
            setNovaData("");
            setNovoBloco("");
            setNovaLista("");
            alert("Lista de convidados enviada para a portaria com sucesso!");
            carregarDados(morador.id);
        } else {
            alert("Erro ao salvar a lista. Tente novamente.");
        }
        setSalvando(false);
    };

    const handleRemover = async (id: number) => {
        if (!confirm("Tem certeza que deseja cancelar esta lista?")) return;
        const sucesso = await removerEventoSalao(id);
        if (sucesso) {
            carregarDados(morador.id);
        } else {
            alert("Erro ao remover");
        }
    };

    if (loading) return <div className="p-8 text-center text-foreground">Carregando...</div>;

    return (
        <div className="space-y-6 max-w-md mx-auto pb-20">
            <div className="flex items-center gap-4 bg-card p-4 rounded-lg shadow-sm border border-border">
                <Button variant="ghost" size="icon" onClick={() => router.push('/morador/dashboard')} className="hover:bg-muted">
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
                        <PartyPopper size={20} className="text-pink-500" /> Salão de Festas
                    </h2>
                    <p className="text-sm text-muted-foreground">Envie sua lista de convidados para a portaria</p>
                </div>
            </div>

            <Card className="border-pink-500/30 shadow-md bg-card text-card-foreground">
                <CardHeader>
                    <CardTitle className="text-lg text-pink-500 flex items-center gap-2">
                        <Calendar size={18} /> Nova Reserva
                    </CardTitle>
                    <CardDescription>Preencha os dados do evento e cole a lista de convidados (um por linha).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Data do Evento</label>
                            <Input
                                type="date"
                                value={novaData}
                                onChange={e => setNovaData(e.target.value)}
                                className="bg-background text-foreground"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground">Bloco do Salão</label>
                            <select
                                value={novoBloco}
                                onChange={e => setNovoBloco(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                            >
                                <option value="" disabled>Selecione</option>
                                <option value="A">Bloco A</option>
                                <option value="B">Bloco B</option>
                                <option value="C">Bloco C</option>
                                <option value="D">Bloco D</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Lista de Convidados</label>
                        <Textarea
                            placeholder="Ex:&#10;João Silva&#10;Maria Oliveira&#10;Carlos Santos"
                            value={novaLista}
                            onChange={e => setNovaLista(e.target.value)}
                            className="bg-background text-foreground min-h-[150px] font-mono text-sm leading-relaxed"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck="false"
                        />
                        <p className="text-xs text-muted-foreground">Cole ou digite os nomes, colocando cada convidado em uma nova linha.</p>
                    </div>

                    <Button onClick={handleSalvar} disabled={salvando} className="w-full bg-pink-600 hover:bg-pink-700 text-white">
                        {salvando ? "Enviando..." : "Enviar Lista para Portaria"}
                    </Button>
                </CardContent>
            </Card>

            <h3 className="font-bold text-foreground mt-8 mb-4">Suas Listas / Eventos Registrados</h3>

            {eventos.length === 0 ? (
                <div className="text-center p-8 bg-muted/50 rounded-lg text-muted-foreground border border-border">
                    Você ainda não enviou nenhuma lista.
                </div>
            ) : (
                <div className="space-y-4">
                    {eventos.map(ev => (
                        <Card key={ev.id} className="bg-card text-card-foreground shadow-sm">
                            <CardContent className="p-4 flex justify-between items-start gap-4">
                                <div>
                                    <div className="flex gap-2 items-center mb-1">
                                        <h4 className="font-bold text-pink-600 dark:text-pink-400">Salão Bloco {ev.bloco_salao}</h4>
                                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-foreground">
                                            {new Date(ev.data_evento + 'T12:00:00Z').toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 font-mono whitespace-pre-wrap line-clamp-3">
                                        {ev.lista_convidados}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleRemover(ev.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 flex-shrink-0">
                                    <Trash2 size={18} />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
