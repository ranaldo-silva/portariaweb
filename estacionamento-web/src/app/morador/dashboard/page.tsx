"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, Car, Users, Phone, LogOut, Clock, PartyPopper } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export default function DashboardMorador() {
    const router = useRouter();
    const [morador, setMorador] = useState<any>(null);
    const [encomendas, setEncomendas] = useState<any[]>([]);
    const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const id = localStorage.getItem("morador_session_id");
        if (!id) {
            router.push("/morador/login");
            return;
        }
        carregarDados(id);
    }, []);

    const carregarDados = async (id: string) => {
        setLoading(true);
        try {
            // 1. Get Resident Data
            const { data: m, error: errM } = await supabase
                .from('moradores')
                .select('*')
                .eq('id', id)
                .single();

            if (errM || !m) {
                alert("Erro ao carregar dados. Faça login novamente.");
                router.push("/morador/login");
                return;
            }
            setMorador(m);

            // 2. Get Packages (Pending)
            const { data: enc } = await supabase
                .from('encomendas')
                .select('*')
                .eq('morador_id', id)
                .eq('status', 'Pendente')
                .order('data_chegada', { ascending: false });
            setEncomendas(enc || []);

            // 3. Get Pending Requests
            const { data: sol } = await supabase
                .from('solicitacoes')
                .select('*')
                .eq('morador_id', id)
                .eq('status', 'pendente')
                .order('data_solicitacao', { ascending: false });
            setSolicitacoes(sol || []);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push("/morador/login");
    };

    if (loading) return <div className="p-8 text-center">Carregando...</div>;

    // Parser helpers
    const getVeiculos = () => {
        const c = morador?.carro_detalhes ? [{ tipo: 'Carro', info: morador.carro_detalhes }] : [];
        const m = morador?.moto_detalhes ? [{ tipo: 'Moto', info: morador.moto_detalhes }] : [];
        return [...c, ...m];
    };

    return (
        <div className="space-y-6 max-w-md mx-auto">
            {/* Welcome */}
            <div className="flex justify-between items-center bg-card border border-border p-4 rounded-lg shadow-sm">
                <div>
                    <h2 className="font-bold text-foreground text-lg">Olá, {morador?.nome_responsavel?.split(' ')[0]}</h2>
                    <p className="text-sm text-muted-foreground">Apto {morador?.apartamento} - {morador?.bloco}</p>
                </div>
                <div className="flex gap-2">
                    <ModeToggle />
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
                        <LogOut size={20} />
                    </Button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <div onClick={() => router.push('/morador/encomendas')} className="cursor-pointer transition-transform hover:scale-[1.01]">
                    <Card className="border-gold/30 shadow-md bg-card text-card-foreground h-full">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="flex items-center gap-2 text-gold text-sm">
                                <Package size={18} /> Encomendas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-2xl font-bold">{encomendas.length}</p>
                            <p className="text-xs text-muted-foreground">Pendentes</p>
                        </CardContent>
                    </Card>
                </div>

                <div onClick={() => router.push('/morador/visitas')} className="cursor-pointer transition-transform hover:scale-[1.01]">
                    <Card className="border-green-500/30 shadow-md bg-card text-card-foreground h-full">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                                <Users size={18} /> Visita
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-sm font-bold mt-1">Autorizar Entrada</p>
                            <p className="text-xs text-muted-foreground">Pré-liberar visitante</p>
                        </CardContent>
                    </Card>
                </div>
                <div onClick={() => router.push('/morador/salao-festas')} className="cursor-pointer transition-transform hover:scale-[1.01] col-span-2">
                    <Card className="border-pink-500/30 shadow-md bg-card text-card-foreground h-full">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <h3 className="flex items-center gap-2 font-bold text-pink-600 dark:text-pink-400">
                                    <PartyPopper size={18} /> Salão de Festas
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">Envie sua lista de convidados</p>
                            </div>
                            <Button size="sm" variant="outline" className="h-8 text-xs border-pink-200 text-pink-700 hover:bg-pink-50 dark:hover:bg-pink-900/30 dark:border-pink-800 dark:text-pink-300">Acessar</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Data Management Grid */}
            <div className="grid grid-cols-1 gap-4">
                {/* Vehicles */}
                {/* Vehicles */}
                <Card className="border-l-4 border-l-blue-500 bg-card text-card-foreground">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold flex items-center gap-2 text-foreground">
                                <Car size={18} /> Veículos
                            </h3>
                        </div>

                        <div className="space-y-4">
                            {/* Slot CARRO */}
                            <div className="flex items-center justify-between bg-muted/50 p-3 rounded border border-border">
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Carro</p>
                                    <p className="text-sm font-medium text-foreground">
                                        {morador?.carro_detalhes || "Não cadastrado"}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant={morador?.carro_detalhes ? "outline" : "default"}
                                    className={morador?.carro_detalhes ? "h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50" : "h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"}
                                    onClick={() => router.push('/morador/solicitacao?tipo=veiculo&categoria=Carro')}
                                >
                                    {morador?.carro_detalhes ? "Atualizar" : "Cadastrar"}
                                </Button>
                            </div>

                            {/* Slot MOTO */}
                            <div className="flex items-center justify-between bg-muted/50 p-3 rounded border border-border">
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Moto</p>
                                    <p className="text-sm font-medium text-foreground">
                                        {morador?.moto_detalhes || "Não cadastrado"}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant={morador?.moto_detalhes ? "outline" : "default"}
                                    className={morador?.moto_detalhes ? "h-8 text-xs border-blue-200 text-blue-700 hover:bg-blue-50" : "h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"}
                                    onClick={() => router.push('/morador/solicitacao?tipo=veiculo&categoria=Moto')}
                                >
                                    {morador?.moto_detalhes ? "Atualizar" : "Cadastrar"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Dependents */}
                <Card className="border-l-4 border-l-green-500 bg-card text-card-foreground">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold flex items-center gap-2 text-foreground">
                                <Users size={18} /> Dependentes
                            </h3>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => router.push('/morador/solicitacao?tipo=dependente')}
                            >
                                Editar
                            </Button>
                        </div>
                        <div className="text-sm text-foreground bg-muted/50 p-2 rounded min-h-[40px]">
                            {morador?.lista_moradores || "Nenhum dependente listado."}
                        </div>
                    </CardContent>
                </Card>

                {/* Contact */}
                <Card className="border-l-4 border-l-purple-500 bg-card text-card-foreground">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold flex items-center gap-2 text-foreground">
                                <Phone size={18} /> Contato
                            </h3>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => router.push('/morador/solicitacao?tipo=contato')}
                            >
                                Atualizar
                            </Button>
                        </div>
                        <div className="text-sm font-medium text-foreground">
                            {morador?.whatsapp || "Não informado"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Requests List */}
            {solicitacoes.length > 0 && (
                <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg border border-orange-100 dark:border-orange-800">
                    <h3 className="text-orange-800 dark:text-orange-400 font-bold mb-2 flex items-center gap-2">
                        <Clock size={16} /> Solicitações Pendentes
                    </h3>
                    <div className="space-y-2">
                        {solicitacoes.map(sol => (
                            <div key={sol.id} className="text-xs bg-white dark:bg-black/20 p-2 rounded border border-orange-100 dark:border-orange-900 shadow-sm text-foreground">
                                <span className="font-bold uppercase">{sol.tipo}</span> - Enviado em {new Date(sol.data_solicitacao).toLocaleDateString()}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
