"use client";

import { useState, useEffect } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Megaphone, AlertTriangle, Eye, Flame, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Alertas() {
    const { enviarAlerta, getAlertas, removerAlerta } = useStorage();

    const [alertas, setAlertas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [nomeCondominio, setNomeCondominio] = useState('Portaria Principal');
    const [customTitulo, setCustomTitulo] = useState('');
    const [customDesc, setCustomDesc] = useState('');
    const [showCustom, setShowCustom] = useState(false);

    useEffect(() => { carregar(); }, []);

    const carregar = async () => {
        setLoading(true);
        const dados = await getAlertas();
        setAlertas(dados || []);
        setLoading(false);
    };

    const handleEnviar = async (tipo: string, titulo: string, descricao: string) => {
        if (!confirm(`CONFIRMAR ALERTA DE ${titulo}?`)) return;

        const sucesso = await enviarAlerta({
            tipo,
            titulo,
            descricao,
            autor: nomeCondominio
        });

        if (sucesso) {
            alert("Alerta Enviado!");
            setCustomTitulo(''); setCustomDesc(''); setShowCustom(false);
            carregar();
        } else {
            alert("Erro ao enviar");
        }
    };

    const getStyle = (tipo: string) => {
        switch (tipo) {
            case 'panico': return { icon: AlertTriangle, color: 'text-red-500', border: 'border-red-500' };
            case 'suspeito': return { icon: Eye, color: 'text-yellow-500', border: 'border-yellow-500' };
            case 'fogo': return { icon: Flame, color: 'text-orange-500', border: 'border-orange-500' };
            default: return { icon: Megaphone, color: 'text-blue-500', border: 'border-blue-500' };
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    onClick={() => handleEnviar('panico', 'PÂNICO / ROUBO', 'Ocorrendo AGORA! Ajuda!')}
                >
                    <AlertTriangle size={32} />
                    <span className="font-bold">PÂNICO</span>
                </Button>
                <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                    onClick={() => handleEnviar('suspeito', 'SUSPEITO', 'Atividade suspeita notada.')}
                >
                    <Eye size={32} />
                    <span className="font-bold">SUSPEITO</span>
                </Button>
                <Button
                    variant="outline"
                    className="h-24 flex flex-col gap-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                    onClick={() => handleEnviar('fogo', 'INCÊNDIO', 'Princípio de incêndio.')}
                >
                    <Flame size={32} />
                    <span className="font-bold">FOGO</span>
                </Button>
            </div>

            <Card className="bg-navy-light border-gold">
                <CardHeader><CardTitle className="text-gold">Alerta Personalizado</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <Input placeholder="Título" value={customTitulo} onChange={e => setCustomTitulo(e.target.value)} className="bg-white text-black" />
                    <Input placeholder="Descrição" value={customDesc} onChange={e => setCustomDesc(e.target.value)} className="bg-white text-black" />
                    <Button className="w-full bg-gold text-navy font-bold" onClick={() => handleEnviar('custom', customTitulo, customDesc)}>ENVIAR</Button>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Últimos Alertas (24h)</h2>
                {alertas.map(a => {
                    const style = getStyle(a.tipo);
                    const Icon = style.icon;
                    return (
                        <Card key={a.id} className={cn("bg-navy border-l-4", style.border)}>
                            <CardContent className="p-4 flex gap-4">
                                <Icon className={style.color} size={32} />
                                <div className="flex-1">
                                    <h4 className={cn("font-bold text-lg", style.color)}>{a.titulo}</h4>
                                    <p className="text-white">{a.descricao}</p>
                                    <p className="text-xs text-gray-500 mt-2">{new Date(a.data_hora).toLocaleString()} - {a.autor}</p>
                                </div>
                                <Button size="icon" variant="ghost" className="text-red-500 opacity-50 hover:opacity-100" onClick={async () => {
                                    if (confirm("Apagar alerta?")) {
                                        await removerAlerta(a.id);
                                        carregar();
                                    }
                                }}>
                                    <Trash2 size={18} />
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}
