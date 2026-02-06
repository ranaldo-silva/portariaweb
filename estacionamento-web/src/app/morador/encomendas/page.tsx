"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package, CheckCircle, Clock } from "lucide-react";

export default function HistoricoEncomendas() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [encomendas, setEncomendas] = useState<any[]>([]);

    useEffect(() => {
        const id = localStorage.getItem("morador_session_id");
        if (!id) {
            router.push("/morador/login");
            return;
        }
        carregar(id);
    }, []);

    const carregar = async (id: string) => {
        setLoading(true);
        try {
            const { data } = await supabase
                .from('encomendas')
                .select('*')
                .eq('morador_id', id)
                .order('data_chegada', { ascending: false });
            setEncomendas(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string) => new Date(date).toLocaleString('pt-BR');

    const pendentes = encomendas.filter(e => e.status === 'Pendente');
    const historico = encomendas.filter(e => e.status !== 'Pendente');

    return (
        <div className="max-w-md mx-auto p-4 space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground pl-0">
                    <ArrowLeft size={20} className="mr-2" /> Voltar
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Minhas Encomendas</h1>
                    <p className="text-xs text-muted-foreground">Gerencie suas entregas e histórico</p>
                </div>
            </div>

            {/* Pendentes */}
            <div className="space-y-3">
                <h2 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                    <Clock size={16} /> A Retirar ({pendentes.length})
                </h2>
                {pendentes.length === 0 ? (
                    <Card className="bg-card border-border">
                        <CardContent className="p-4 text-center text-sm text-muted-foreground">
                            Nenhuma encomenda aguardando retirada.
                        </CardContent>
                    </Card>
                ) : (
                    pendentes.map(enc => (
                        <Card key={enc.id} className="bg-card border-l-4 border-l-gold shadow-sm">
                            <CardContent className="p-4 flex gap-4 items-center">
                                {enc.foto_url && (
                                    <div className="h-14 w-14 bg-cover bg-center rounded-md shrink-0 bg-muted" style={{ backgroundImage: `url(${enc.foto_url})` }} />
                                )}
                                <div className="flex-1">
                                    <h4 className="font-bold text-foreground">{enc.origem}</h4>
                                    {enc.destinatario && <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">Para: {enc.destinatario}</p>}
                                    <p className="text-xs text-muted-foreground">Chegou: {formatDate(enc.data_chegada)}</p>
                                    <div className="mt-2 inline-block bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold px-2 py-1 rounded">
                                        Cód: {enc.token}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Histórico */}
            <div className="space-y-3">
                <h2 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
                    <CheckCircle size={16} /> Histórico ({historico.length})
                </h2>
                <div className="space-y-2">
                    {historico.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">Nenhum histórico disponível.</p>
                    ) : (
                        historico.map(enc => (
                            <Card key={enc.id} className="border-border shadow-sm">
                                <CardContent className="p-3 flex justify-between items-center bg-card rounded-lg">
                                    <div>
                                        <p className="font-bold text-foreground text-sm flex items-center gap-2">
                                            {enc.origem}
                                            {enc.destinatario && <span className="text-[10px] uppercase font-normal text-muted-foreground border px-1 rounded">Para: {enc.destinatario}</span>}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Retirada: {enc.data_retirada ? formatDate(enc.data_retirada) : '-'}
                                            {enc.retirado_por && (
                                                <span className="block text-green-600 dark:text-green-400 font-bold mt-1">
                                                    Via {enc.retirado_por}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-3 py-1 rounded-full border border-green-200 dark:border-green-800">
                                        Entregue
                                    </span>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
