"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";

function SolicitacaoForm() {
    const router = useRouter();
    const params = useSearchParams();
    const tipo = params.get("tipo") || "veiculo";

    const [loading, setLoading] = useState(false);
    const [moradorId, setMoradorId] = useState("");

    // Form States
    const [formData, setFormData] = useState<any>({
        tipo_veiculo: params.get('categoria') || "Carro"
    });

    useEffect(() => {
        const id = localStorage.getItem("morador_session_id");
        if (!id) {
            router.push("/morador/login");
            return;
        }
        setMoradorId(id);
    }, []);

    const handleChange = (field: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!moradorId) return;
        setLoading(true);

        try {
            if (tipo === 'visita') {
                const { error } = await supabase.from('pre_autorizacoes').insert([{
                    morador_id: moradorId,
                    visitante_nome: formData.nome,
                    documento: formData.documento,
                    observacoes: formData.observacoes,
                    status: 'pendente'
                }]);
                if (error) throw error;
                alert("Visitante autorizado com sucesso!");
                router.push("/morador/visitas");
                return;
            }

            // Prepare data based on type
            const payload = {
                morador_id: moradorId,
                tipo,
                dados_novos: formData,
                status: 'pendente'
            };

            const { error } = await supabase.from('solicitacoes').insert([payload]);

            if (error) throw error;

            alert("Solicitação enviada para aprovação!");
            router.push("/morador/dashboard");
        } catch (e) {
            console.error(e);
            alert("Erro ao enviar solicitação.");
        } finally {
            setLoading(false);
        }
    };

    const renderForm = () => {
        switch (tipo) {
            case 'veiculo':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Modelo (Ex: Ford Ka)</label>
                            <Input
                                placeholder="Modelo do Veículo"
                                onChange={e => handleChange('modelo', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Placa (Ex: ABC-1234)</label>
                            <Input
                                placeholder="Placa"
                                onChange={e => handleChange('placa', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Cor</label>
                            <Input
                                placeholder="Cor do Veículo"
                                onChange={e => handleChange('cor', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Tipo</label>
                            <select
                                className="w-full p-2 border rounded-md"
                                value={formData.tipo_veiculo || params.get('categoria') || "Carro"}
                                onChange={e => handleChange('tipo_veiculo', e.target.value)}
                            >
                                <option value="Carro">Carro</option>
                                <option value="Moto">Moto</option>
                            </select>
                        </div>
                    </div>
                );
            case 'dependente':
                return (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-4">
                            Liste todos os dependentes que residem no imóvel, separados por vírgula.
                        </div>
                        <div>
                            <label className="text-sm font-medium">Nomes completados</label>
                            <Textarea
                                placeholder="Maria Silva, João Silva..."
                                onChange={e => handleChange('dependentes', e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                );
            case 'visita':
                return (
                    <div className="space-y-4">
                        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-4">
                            Autorize a entrada de um visitante. Ele aparecerá na lista da portaria.
                        </div>
                        <div>
                            <label className="text-sm font-medium">Nome do Visitante</label>
                            <Input
                                placeholder="Nome Completo"
                                onChange={e => handleChange('nome', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Documento (RG/CPF)</label>
                            <Input
                                placeholder="Apenas números (opcional)"
                                onChange={e => handleChange('documento', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Observações</label>
                            <Textarea
                                placeholder="Ex: Entregar chaves, Prestador de serviço..."
                                onChange={e => handleChange('observacoes', e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                );
            case 'contato':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Novo WhatsApp</label>
                            <Input
                                placeholder="11 99999-9999"
                                onChange={e => handleChange('whatsapp', e.target.value)}
                                type="tel"
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const getTitle = () => {
        if (tipo === 'veiculo') return "Novo Veículo";
        if (tipo === 'dependente') return "Atualizar Dependentes";
        if (tipo === 'contato') return "Atualizar Contato";
        if (tipo === 'visita') return "Autorizar Visitante";
        return "Solicitação";
    };

    return (
        <div className="max-w-md mx-auto">
            <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
                <ArrowLeft size={16} className="mr-2" /> Voltar
            </Button>

            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">{getTitle()}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {renderForm()}

                    <Button
                        className="w-full bg-primary text-primary-foreground font-bold hover:bg-primary/90"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "Enviando..." : "Enviar Solicitação"}
                        <Save className="ml-2 h-4 w-4" />
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <SolicitacaoForm />
        </Suspense>
    );
}
