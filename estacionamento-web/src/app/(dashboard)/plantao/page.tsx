"use client";

import { useState, useEffect } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NotebookPen, Save, FileText, Plus, Trash2, Clock, CheckCircle, MessageCircle } from 'lucide-react';
import { printHTML } from '@/lib/print';

export default function Plantao() {
    const { salvarPlantao, getPlantao } = useStorage();

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [turno, setTurno] = useState('DIURNO');

    // Porteiro State
    const [porteiro, setPorteiro] = useState({ nome: '', entrada: '', saida: '' });

    // Ocorrencias
    const [ocorrencias, setOcorrencias] = useState('');

    // Colaboradores State: Array of { nome, funcao, entrada, saida }
    const [colaboradores, setColaboradores] = useState<any[]>([]);

    // New Colab Input
    const [nc, setNc] = useState({ nome: '', funcao: '' });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function load() {
            setLoading(true);
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
            setLoading(false);
        }
        load();
    }, [date, turno, getPlantao]);

    const getTime = () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const handleRegistrarEntradaPorteiro = () => {
        if (!porteiro.nome) return alert("Digite o nome do porteiro primeiro.");
        if (porteiro.entrada) return; // Já tem entrada
        setPorteiro({ ...porteiro, entrada: getTime() });
    };

    const handleRegistrarSaidaPorteiro = () => {
        if (!porteiro.entrada) return alert("Registre a entrada primeiro.");
        setPorteiro({ ...porteiro, saida: getTime() });
    };

    const handleAdicionarColaborador = () => {
        if (!nc.nome || !nc.funcao) return alert("Preencha nome e função.");
        const novo = {
            nome: nc.nome,
            funcao: nc.funcao,
            entrada: getTime(),
            saida: ''
        };
        setColaboradores([...colaboradores, novo]);
        setNc({ nome: '', funcao: '' });
    };

    const handleRegistrarSaidaColaborador = (index: number) => {
        const lista = [...colaboradores];
        if (!lista[index].saida) {
            lista[index].saida = getTime();
            setColaboradores(lista);
        }
    };

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

    const handleWhatsApp = () => {
        const header = `*LIVRO DE PLANTÃO - ${new Date(date).toLocaleDateString()} (${turno})*`;
        const pInfo = `\n👮 *Porteiro:* ${porteiro.nome || 'N/A'}\n🕒 *Entrada:* ${porteiro.entrada || '--:--'} | *Saída:* ${porteiro.saida || '--:--'}`;

        const cList = colaboradores.length > 0
            ? `\n\n🧹 *Colaboradores:*\n` + colaboradores.map(c => `- ${c.nome} (${c.funcao}): ${c.entrada} às ${c.saida || '...'}`).join('\n')
            : '';

        const oInfo = `\n\n📝 *Ocorrências:*\n${ocorrencias || 'Sem ocorrências.'}`;

        const text = encodeURIComponent(header + pInfo + cList + oInfo);
        window.open(`https://wa.me/?text=${text}`, '_blank');
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

    const handleLimpar = () => {
        if (confirm("Tem certeza? Isso limpará todos os campos não salvos.")) {
            setPorteiro({ nome: '', entrada: '', saida: '' });
            setOcorrencias('');
            setColaboradores([]);
        }
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

            {/* PORTEIRO */}
            <Card className="bg-navy-light border-gold">
                <CardHeader><CardTitle className="text-gold flex items-center gap-2"><Clock /> Controle de Ponto (Porteiro)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        placeholder="Nome do Porteiro"
                        value={porteiro.nome}
                        onChange={e => setPorteiro({ ...porteiro, nome: e.target.value })}
                        className="bg-white text-black text-lg"
                    />

                    <div className="flex gap-4">
                        <div className="flex-1 bg-navy p-3 rounded border border-gray-700 text-center">
                            <p className="text-gray-400 text-xs mb-1">ENTRADA</p>
                            {porteiro.entrada ? (
                                <p className="text-2xl font-bold text-green-500">{porteiro.entrada}</p>
                            ) : (
                                <Button
                                    className="w-full bg-green-700 hover:bg-green-600 text-white"
                                    onClick={handleRegistrarEntradaPorteiro}
                                    disabled={!porteiro.nome}
                                >
                                    REGISTRAR
                                </Button>
                            )}
                        </div>
                        <div className="flex-1 bg-navy p-3 rounded border border-gray-700 text-center">
                            <p className="text-gray-400 text-xs mb-1">SAÍDA</p>
                            {porteiro.saida ? (
                                <p className="text-2xl font-bold text-red-500">{porteiro.saida}</p>
                            ) : (
                                <Button
                                    className="w-full bg-red-700 hover:bg-red-600 text-white"
                                    onClick={handleRegistrarSaidaPorteiro}
                                    disabled={!porteiro.entrada}
                                >
                                    REGISTRAR
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* COLABORADORES */}
            <Card className="bg-navy-light border-gold">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle className="text-gold flex items-center gap-2"><NotebookPen /> Colaboradores no Turno</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                            <label className="text-xs text-gray-400">Nome</label>
                            <Input value={nc.nome} onChange={e => setNc({ ...nc, nome: e.target.value })} className="bg-white text-black" placeholder="Ex: João Silva" />
                        </div>
                        <div className="w-1/3 space-y-1">
                            <label className="text-xs text-gray-400">Função</label>
                            <Input value={nc.funcao} onChange={e => setNc({ ...nc, funcao: e.target.value })} className="bg-white text-black" placeholder="Ex: Limpeza" />
                        </div>
                        <Button size="icon" className="bg-success text-white h-10 w-10 mb-[2px]" onClick={handleAdicionarColaborador} title="Registrar Entrada"><Plus /></Button>
                    </div>

                    <div className="space-y-2 mt-4">
                        {colaboradores.map((c, i) => (
                            <div key={i} className="flex justify-between items-center bg-navy p-3 rounded border border-gray-700">
                                <div>
                                    <div className="font-bold text-white text-lg">{c.nome}</div>
                                    <div className="text-sm text-gray-400">{c.funcao}</div>
                                    <div className="text-xs mt-1 flex gap-2">
                                        <span className="text-green-400">Entrada: {c.entrada}</span>
                                        {c.saida ? (
                                            <span className="text-red-400">Saída: {c.saida}</span>
                                        ) : (
                                            <span className="text-yellow-500 animate-pulse">● Trabalhando</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {!c.saida && (
                                        <Button size="sm" variant="outline" className="text-red-400 border-red-900 hover:bg-red-900/20" onClick={() => handleRegistrarSaidaColaborador(i)}>
                                            Baixar Saída
                                        </Button>
                                    )}
                                    <Button size="icon" variant="ghost" className="text-gray-500 hover:text-red-500 h-8 w-8" onClick={() => {
                                        const nw = [...colaboradores]; nw.splice(i, 1); setColaboradores(nw);
                                    }}><Trash2 size={16} /></Button>
                                </div>
                            </div>
                        ))}
                        {colaboradores.length === 0 && (
                            <p className="text-center text-gray-500 text-sm py-4">Nenhum colaborador registrado neste turno.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* OCORRENCIAS */}
            <Card className="bg-navy-light border-gold">
                <CardHeader><CardTitle className="text-gold">📝 Ocorrências / Observações</CardTitle></CardHeader>
                <CardContent>
                    <textarea
                        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-black min-h-[150px]"
                        placeholder="Relatar ocorrências do turno (entregas importantes, incidentes, avisos)..."
                        value={ocorrencias}
                        onChange={e => setOcorrencias(e.target.value)}
                    />
                </CardContent>
            </Card>

            {/* ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button className="md:col-span-1 bg-gold text-navy font-bold h-12 hover:bg-yellow-500" onClick={handleSalvar} disabled={loading}>
                    <Save className="mr-2" /> SALVAR
                </Button>
                <Button className="md:col-span-1 bg-red-600 text-white font-bold h-12 hover:bg-red-700" onClick={handleLimpar}>
                    <Trash2 className="mr-2" /> LIMPAR
                </Button>
                <Button className="md:col-span-1 bg-green-600 text-white font-bold h-12 hover:bg-green-700" onClick={handleWhatsApp}>
                    <MessageCircle className="mr-2" /> WHATSAPP
                </Button>
                <Button className="md:col-span-1 bg-blue-600 text-white font-bold h-12 hover:bg-blue-700" onClick={handlePrint}>
                    <FileText className="mr-2" /> PDF
                </Button>
            </div>
        </div>
    );
}
