"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStorage } from "@/hooks/useStorage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Calendar, User, Clock, CheckCircle, XCircle } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export default function HistoricoVisitas() {
    const router = useRouter();
    const { getHistoricoVisitas, cancelarAgendamento } = useStorage();
    const [visitas, setVisitas] = useState<any[]>([]);
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
        const data = await getHistoricoVisitas(id);
        setVisitas(data || []);
        setLoading(false);
    };

    const handleCancelar = async (id: string) => {
        if (!confirm("Deseja cancelar esta autorização?")) return;
        const ok = await cancelarAgendamento(id);
        if (ok) {
            const userId = localStorage.getItem("morador_session_id");
            if (userId) carregarDados(userId);
        } else {
            alert("Erro ao cancelar.");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pendente': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'realizada': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'cancelada': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-500';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pendente': return 'Aguardando Chegada';
            case 'realizada': return 'Entrada Registrada';
            case 'cancelada': return 'Cancelada';
            default: return status;
        }
    };

    return (
        <div className="max-w-md mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex justify-between items-center bg-card border border-border p-4 rounded-lg shadow-sm">
                <Button variant="ghost" size="icon" onClick={() => router.push('/morador/dashboard')}>
                    <ArrowLeft size={20} />
                </Button>
                <h2 className="font-bold text-lg text-foreground">Minhas Visitas</h2>
                <ModeToggle />
            </div>

            {/* Action Button */}
            <Button
                className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg"
                onClick={() => router.push('/morador/solicitacao?tipo=visita')}
            >
                <Plus className="mr-2" /> Nova Autorização
            </Button>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground p-4 bg-card rounded shadow border border-border">Carregando histórico...</div>
                ) : visitas.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-card rounded shadow border border-border p-6">
                        <User size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Nenhuma visita registrada.</p>
                        <p className="text-sm mt-1">Autorize visitantes para facilitar a entrada.</p>
                    </div>
                ) : (
                    visitas.map((v) => (
                        <Card key={v.id} className={`border ${getStatusColor(v.status)} border bg-card`}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                                            {v.visitante_nome}
                                        </h3>
                                        {v.documento && (
                                            <p className="text-sm text-muted-foreground">Doc: {v.documento}</p>
                                        )}
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(v.status)}`}>
                                        {getStatusText(v.status)}
                                    </div>
                                </div>

                                {v.observacoes && (
                                    <div className="bg-muted/50 p-2 rounded text-xs text-muted-foreground mt-2 italic border border-border/50">
                                        Obs: {v.observacoes}
                                    </div>
                                )}

                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                                    <span className="flex items-center gap-1">
                                        <Calendar size={14} /> {new Date(v.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={14} /> {new Date(v.created_at).toLocaleTimeString().slice(0, 5)}
                                    </span>
                                </div>

                                {v.status === 'pendente' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full mt-3 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900"
                                        onClick={() => handleCancelar(v.id)}
                                    >
                                        Cancelar Autorização
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
