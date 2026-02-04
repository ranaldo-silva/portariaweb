"use client";

import { useState, useEffect } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateReportHTML, printHTML } from '@/lib/print';
import { FileText, Trash2, Car, Package } from 'lucide-react';

export default function Admin() {
    const { getVeiculos, getHistorico, getTodasEncomendas, limparHistorico, limparAtivos } = useStorage();

    const [veiculos, setVeiculos] = useState<any[]>([]);
    const [historico, setHistorico] = useState<any[]>([]);
    const [encomendas, setEncomendas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function load() {
            const [v, h, e] = await Promise.all([getVeiculos(), getHistorico(), getTodasEncomendas()]);
            setVeiculos(v || []);
            setHistorico(h || []);
            setEncomendas(e || []);
        }
        load();
    }, [getVeiculos, getHistorico, getTodasEncomendas]);

    const handlePrintCarros = () => {
        const data = [...veiculos.map(v => ({ ...v, STATUS: 'ATIVO' })), ...historico.map(h => ({ ...h, STATUS: 'SAIU' }))];
        const html = generateReportHTML("Relatório de Veículos", data);
        printHTML(html);
    };

    const handlePrintEncomendas = () => {
        const html = generateReportHTML("Relatório de Encomendas", encomendas);
        printHTML(html);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gold">Painel Administrativo</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-navy-light border-gold">
                    <CardHeader><CardTitle className="text-gold flex gap-2"><Car /> Relatórios de Acesso</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-gray-300">Veículos Ativos: {veiculos.length} | Histórico: {historico.length}</p>
                        <Button className="w-full bg-blue-600 text-white" onClick={handlePrintCarros}>
                            <FileText className="mr-2" /> Gerar Relatório Veículos
                        </Button>
                        <hr className="border-gray-600 my-4" />
                        <Button variant="destructive" className="w-full" onClick={async () => {
                            if (confirm("Zerar TODO o histórico de saídas?")) {
                                await limparHistorico();
                                alert("Limpo!");
                            }
                        }}>
                            <Trash2 className="mr-2" /> Zerar Histórico
                        </Button>
                        <Button variant="destructive" className="w-full" onClick={async () => {
                            if (confirm("Zerar TODO o mapa de vagas atual?")) {
                                await limparAtivos();
                                alert("Limpo!");
                            }
                        }}>
                            <Trash2 className="mr-2" /> Zerar Mapa Vagas
                        </Button>
                    </CardContent>
                </Card>

                <Card className="bg-navy-light border-gold">
                    <CardHeader><CardTitle className="text-gold flex gap-2"><Package /> Relatórios de Encomendas</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-gray-300">Total Encomendas: {encomendas.length}</p>
                        <Button className="w-full bg-blue-600 text-white" onClick={handlePrintEncomendas}>
                            <FileText className="mr-2" /> Gerar Relatório Encomendas
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
