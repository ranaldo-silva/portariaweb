"use client";

import { useState, useEffect } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NotebookPen, Save, FileText, Plus, Trash2 } from 'lucide-react';
import { printHTML } from '@/lib/print';

export default function Plantao() {
    const { salvarPlantao, getPlantao } = useStorage();

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [turno, setTurno] = useState('DIURNO');
    const [porteiro, setPorteiro] = useState({ nome: '', entrada: '', saida: '' });
    const [ocorrencias, setOcorrencias] = useState('');
    const [colaboradores, setColaboradores] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // New Colab Form
    const [nc, setNc] = useState({ nome: '', funcao: '', entrada: '', saida: '' });

    useEffect(() => {
        async function load() {
            const dados = await getPlantao(date, turno);
            if (dados) {
                setPorteiro({
                    nome: dados.porteiro_nome || '',
                    entrada: dados.porteiro_entrada || '',
                    saida: dados.porteiro_saida || ''
                });
                setOcorrencias(dados.ocorrencias || '');
                setColaboradores(dados.colaboradores || []);
            } else {
                setPorteiro({ nome: '', entrada: '', saida: '' });
                setOcorrencias('');
                setColaboradores([]);
            }
        }
        load();
    }, [date, turno]);

    const handleSalvar = async () => {
        setLoading(true);
        const dados = {
            data: date,
            turno,
            porteiro_nome: porteiro.nome,
            porteiro_entrada: porteiro.entrada,
            porteiro_saida: porteiro.saida,
            ocorrencias,
            colaboradores
        };
        await salvarPlantao(dados);
        alert("Plantão salvo!");
        setLoading(false);
    };

    const handlePrint = () => {
        const html = `
        <div style="font-family: sans-serif; padding: 20px;">
            <h1 style="text-align:center; color:#050A30;">Livro de Plantão - ${turno}</h1>
            <p style="text-align:center; color:#666;">Data: ${new Date(date).toLocaleDateString()}</p>
            <hr/>
            <h3>👮 Porteiro</h3>
            <p><strong>Nome:</strong> ${porteiro.nome} | <strong>Entrada:</strong> ${porteiro.entrada} | <strong>Saída:</strong> ${porteiro.saida}</p>
            <hr/>
            <h3>🧹 Colaboradores</h3>
            <ul>
                ${colaboradores.map(c => `<li>${c.nome} (${c.funcao}): ${c.entrada} - ${c.saida}</li>`).join('')}
            </ul>
            <hr/>
            <h3>📝 Ocorrências</h3>
            <p style="white-space: pre-wrap;">${ocorrencias || 'Sem ocorrências.'}</p>
        </div>
      `;
        printHTML(html);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            <div className="flex justify-between items-center bg-navy-light p-4 rounded-lg border border-gold">
                <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="bg-navy text-white border border-gold rounded p-2"
                />
                <div className="flex gap-2">
                    <Button variant={turno === 'DIURNO' ? 'default' : 'outline'} onClick={() => setTurno('DIURNO')} className={turno === 'DIURNO' ? 'bg-gold text-black' : 'text-gray-300'}>☀️ Diurno</Button>
                    <Button variant={turno === 'NOTURNO' ? 'default' : 'outline'} onClick={() => setTurno('NOTURNO')} className={turno === 'NOTURNO' ? 'bg-blue-600 text-white' : 'text-gray-300'}>🌙 Noturno</Button>
                </div>
            </div>

            <Card className="bg-navy-light border-gold">
                <CardHeader><CardTitle className="text-gold">👮 Porteiro Responsável</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <Input placeholder="Nome Porteiro" value={porteiro.nome} onChange={e => setPorteiro({ ...porteiro, nome: e.target.value })} className="bg-white text-black" />
                    <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="Horário Entrada" value={porteiro.entrada} onChange={e => setPorteiro({ ...porteiro, entrada: e.target.value })} className="bg-white text-black" />
                        <Input placeholder="Horário Saída" value={porteiro.saida} onChange={e => setPorteiro({ ...porteiro, saida: e.target.value })} className="bg-white text-black" />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-navy-light border-gold">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle className="text-gold">🧹 Colaboradores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-2">
                        <Input placeholder="Nome" value={nc.nome} onChange={e => setNc({ ...nc, nome: e.target.value })} className="bg-white text-black col-span-2" />
                        <Input placeholder="Função" value={nc.funcao} onChange={e => setNc({ ...nc, funcao: e.target.value })} className="bg-white text-black" />
                        <Button size="icon" className="bg-success text-white" onClick={() => {
                            if (nc.nome) {
                                setColaboradores([...colaboradores, nc]);
                                setNc({ nome: '', funcao: '', entrada: '', saida: '' });
                            }
                        }}><Plus /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Entrada" value={nc.entrada} onChange={e => setNc({ ...nc, entrada: e.target.value })} className="bg-white text-black" />
                        <Input placeholder="Saída" value={nc.saida} onChange={e => setNc({ ...nc, saida: e.target.value })} className="bg-white text-black" />
                    </div>

                    <div className="space-y-2 mt-4">
                        {colaboradores.map((c, i) => (
                            <div key={i} className="flex justify-between items-center bg-navy p-2 rounded text-sm">
                                <div>
                                    <span className="font-bold text-white">{c.nome}</span> <span className="text-gray-400">({c.funcao})</span>
                                    <div className="text-xs text-gold">{c.entrada} - {c.saida}</div>
                                </div>
                                <Button size="icon" variant="ghost" className="text-red-500 h-6 w-6" onClick={() => {
                                    const nw = [...colaboradores]; nw.splice(i, 1); setColaboradores(nw);
                                }}><Trash2 size={14} /></Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-navy-light border-gold">
                <CardHeader><CardTitle className="text-gold">📝 Ocorrências</CardTitle></CardHeader>
                <CardContent>
                    <textarea
                        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-black min-h-[150px]"
                        placeholder="Relatar ocorrências do turno..."
                        value={ocorrencias}
                        onChange={e => setOcorrencias(e.target.value)}
                    />
                </CardContent>
            </Card>

            <div className="flex gap-4">
                <Button className="flex-1 bg-gold text-navy font-bold h-12" onClick={handleSalvar} disabled={loading}>
                    <Save className="mr-2" /> SALVAR PLANTÃO
                </Button>
                <Button className="bg-blue-600 text-white font-bold h-12" onClick={handlePrint}>
                    <FileText className="mr-2" /> IMPRIMIR PDF
                </Button>
            </div>
        </div>
    );
}
