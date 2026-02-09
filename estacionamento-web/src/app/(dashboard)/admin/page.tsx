"use client";

import { useState, useEffect } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { generateReportHTML, printHTML } from '@/lib/print';
import { formatarNomeProprio, formatarVeiculoBase } from '@/lib/utils';
import { FileText, Trash2, Car, Package, Users, Search, Edit } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DetailsModal } from '@/components/DetailsModal';

export default function Admin() {
    const {
        getVeiculos, getHistorico, getTodasEncomendas, limparHistorico, limparAtivos,
        getMoradoresBase, salvarMoradorBase, removerMoradorBase,
        atualizarEncomenda, removerEncomenda
    } = useStorage();

    const [activeTab, setActiveTab] = useState<'dashboard' | 'moradores' | 'encomendas'>('dashboard');

    // Data States
    const [veiculos, setVeiculos] = useState<any[]>([]);
    const [historico, setHistorico] = useState<any[]>([]);
    const [encomendas, setEncomendas] = useState<any[]>([]);
    const [moradores, setMoradores] = useState<any[]>([]);
    const [solicitacoes, setSolicitacoes] = useState<any[]>([]);

    // UI States
    const [buscaMorador, setBuscaMorador] = useState('');
    const [buscaEncomenda, setBuscaEncomenda] = useState('');
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [modalType, setModalType] = useState<any>('morador');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [v, h, e, m] = await Promise.all([
            getVeiculos(),
            getHistorico(),
            getTodasEncomendas(),
            getMoradoresBase()
        ]);
        setVeiculos(v || []);
        setHistorico(h || []);
        setEncomendas(e || []);
        setMoradores(m || []);
        loadSolicitacoes();
    };

    const loadSolicitacoes = async () => {
        const { data } = await supabase
            .from('solicitacoes')
            .select(`*, moradores(nome_responsavel, apartamento, bloco)`)
            .eq('status', 'pendente')
            .order('data_solicitacao', { ascending: false });
        setSolicitacoes(data || []);
    };

    // --- ACTIONS ---

    const handleAprovar = async (sol: any) => {
        if (!confirm("Aprovar e aplicar alterações?")) return;
        try {
            const dados = sol.dados_novos;
            let updatePayload: any = {};

            if (sol.tipo === 'veiculo') {
                const infoVeiculo = `${dados.modelo}, ${dados.placa}, ${dados.cor}`.toUpperCase();
                // Check local state or payload for vehicle type
                if (dados.tipo_veiculo === 'Moto') {
                    updatePayload.moto_detalhes = infoVeiculo;
                } else {
                    updatePayload.carro_detalhes = infoVeiculo;
                }
            }
            else if (sol.tipo === 'dependente') {
                updatePayload.lista_moradores = dados.dependentes.toUpperCase();
            }
            else if (sol.tipo === 'contato') {
                updatePayload.whatsapp = dados.whatsapp.replace(/\D/g, "");
            }
            else if (sol.tipo === 'novo_cadastro') {
                // Insert new resident
                const { error: insertError } = await supabase.from('moradores').insert([{
                    nome_responsavel: formatarNomeProprio(dados.nome),
                    apartamento: parseInt(dados.apartamento),
                    bloco: dados.bloco.toUpperCase(),
                    whatsapp: dados.whatsapp.replace(/\D/g, ""),
                    carro_detalhes: formatarVeiculoBase(dados.carro),
                    moto_detalhes: formatarVeiculoBase(dados.moto),
                    lista_moradores: formatarNomeProprio(dados.dependentes)
                }]);
                if (insertError) throw insertError;

                // We don't need to update an existing morador, so we skip the update call below
                await supabase.from('solicitacoes').update({ status: 'aprovado' }).eq('id', sol.id);
                alert("Cadastro aprovado e morador criado!");
                loadSolicitacoes();
                loadData();
                return;
            }

            const { error: updateError } = await supabase.from('moradores').update(updatePayload).eq('id', sol.morador_id);
            if (updateError) throw updateError;

            await supabase.from('solicitacoes').update({ status: 'aprovado' }).eq('id', sol.id);
            alert("Aprovado com sucesso!");
            loadSolicitacoes();
            loadData(); // Reload main data to reflect changes
        } catch (e) {
            console.error(e);
            alert("Erro ao processar aprovação.");
        }
    };

    const handleRejeitar = async (id: string) => {
        if (!confirm("Rejeitar solicitação?")) return;
        await supabase.from('solicitacoes').update({ status: 'rejeitado' }).eq('id', id);
        loadSolicitacoes();
    };

    // --- CRUD HANDLERS FOR MODAL ---

    const handleSaveMorador = async (data: any) => {
        const sucesso = await salvarMoradorBase(data);
        if (sucesso) {
            alert("Morador atualizado!");
            setSelectedItem(null);
            loadData();
        } else {
            alert("Erro ao atualizar morador.");
        }
    };

    const handleDeleteMorador = async (id: string) => {
        const sucesso = await removerMoradorBase(id);
        if (sucesso) {
            alert("Morador removido!");
            setSelectedItem(null);
            loadData();
        } else {
            alert("Erro ao remover.");
        }
    };

    const handleSaveEncomenda = async (data: any) => {
        const sucesso = await atualizarEncomenda(data.id, data);
        if (sucesso) {
            alert("Encomenda atualizada!");
            setSelectedItem(null);
            loadData();
        } else {
            alert("Erro ao atualizar.");
        }
    };

    const handleDeleteEncomenda = async (id: string) => {
        const sucesso = await removerEncomenda(id);
        if (sucesso) {
            alert("Encomenda removida!");
            setSelectedItem(null);
            loadData();
        } else {
            alert("Erro ao remover.");
        }
    };


    // --- RENDERS ---

    const renderTabs = () => (
        <div className="flex gap-2 border-b border-gold/30 pb-2 mb-6 overflow-x-auto">
            {[
                { id: 'dashboard', label: 'Dashboard & Aprovações', icon: <FileText size={18} /> },
                { id: 'moradores', label: 'Gerenciar Moradores', icon: <Users size={18} /> },
                { id: 'encomendas', label: 'Gerenciar Encomendas', icon: <Package size={18} /> },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                        ? 'bg-navy text-gold border-b-2 border-gold font-bold'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    {tab.icon} {tab.label}
                </button>
            ))}
        </div>
    );

    const renderDashboard = () => (
        <div className="space-y-6 animate-in fade-in">
            {/* APPROVALS SECTION */}
            {solicitacoes.length > 0 ? (
                <Card className="bg-navy-light border-gold shadow-lg">
                    <CardHeader><CardTitle className="text-white flex items-center gap-2"><FileText className="text-gold" /> Aprovações Pendentes ({solicitacoes.length})</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {solicitacoes.map(sol => (
                            <div key={sol.id} className="bg-navy p-4 rounded border border-gray-700 flex flex-col md:flex-row gap-4 items-start md:items-center">
                                <div className="flex-1">
                                    <h4 className="font-bold text-gold text-lg">
                                        {sol.tipo === 'novo_cadastro'
                                            ? sol.dados_novos.nome
                                            : sol.moradores?.nome_responsavel}

                                        <span className="text-sm text-gray-400 ml-2">
                                            {sol.tipo === 'novo_cadastro'
                                                ? `(Ap ${sol.dados_novos.apartamento} ${sol.dados_novos.bloco})`
                                                : `(Ap ${sol.moradores?.apartamento} ${sol.moradores?.bloco})`
                                            }
                                        </span>
                                    </h4>
                                    <p className="text-xs text-white uppercase font-bold bg-blue-900 inline-block px-2 py-0.5 rounded mb-2">{sol.tipo.replace('_', ' ')}</p>
                                    <div className="text-gray-300 text-sm">
                                        {sol.tipo === 'veiculo' && <>Solicita: <strong>{sol.dados_novos.modelo} - {sol.dados_novos.placa}</strong></>}
                                        {sol.tipo === 'dependente' && <>Nova lista: <strong>{sol.dados_novos.dependentes}</strong></>}
                                        {sol.tipo === 'contato' && <>WhatsApp: <strong>{sol.dados_novos.whatsapp}</strong></>}
                                        {sol.tipo === 'novo_cadastro' && (
                                            <Button variant="ghost" className="text-blue-400 p-0 h-auto ml-2 hover:bg-transparent underline" onClick={() => {
                                                const dados = sol.dados_novos;
                                                setSelectedItem({
                                                    nome_responsavel: dados.nome,
                                                    apartamento: dados.apartamento,
                                                    bloco: dados.bloco,
                                                    whatsapp: dados.whatsapp,
                                                    carro_detalhes: `${dados.carro}`,
                                                    moto_detalhes: `${dados.moto}`,
                                                    lista_moradores: dados.dependentes
                                                });
                                                setModalType('morador'); // Reuses resident modal in read-only mode (since no ID)
                                            }}>
                                                Ver Detalhes do Cadastro
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <Button variant="ghost" className="text-blue-400 p-0 h-auto hover:bg-transparent underline mr-2" onClick={() => {
                                        const dados = sol.dados_novos;
                                        let details: any = { ...dados };

                                        // Normalize data for Modal
                                        if (sol.tipo === 'veiculo') {
                                            details = {
                                                ...details,
                                                tipo_veiculo: dados.tipo_veiculo || 'Carro',
                                                modelo: dados.modelo,
                                                placa: dados.placa,
                                                cor: dados.cor
                                            };
                                        } else if (sol.tipo === 'dependente') {
                                            details = { lista_moradores: dados.dependentes };
                                        } else if (sol.tipo === 'contato') {
                                            details = { whatsapp: dados.whatsapp };
                                        }

                                        setSelectedItem(details);
                                        setModalType(sol.tipo === 'novo_cadastro' ? 'morador' : 'detalhes_solicitacao');
                                    }}>
                                        Ver Detalhes
                                    </Button>
                                    <Button className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => handleAprovar(sol)}>Aprovar</Button>
                                    <Button variant="destructive" className="flex-1" onClick={() => handleRejeitar(sol.id)}>Rejeitar</Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ) : (
                <div className="bg-green-900/20 border border-green-800 p-4 rounded text-center text-green-400">
                    Nenhuma solicitação pendente.
                </div>
            )}

            {/* REPORTS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-navy-light border-gold">
                    <CardHeader><CardTitle className="text-gold flex gap-2"><Car /> Veículos</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-gray-300">Veículos Ativos: {veiculos.length} | Histórico: {historico.length}</p>
                        <Button className="w-full bg-blue-600 text-white" onClick={() => {
                            const combined = [
                                ...veiculos.map(v => ({
                                    Vaga: v.vaga,
                                    Placa: v.placa,
                                    Modelo: v.veiculo_nome,
                                    Apartamento: `AP ${v.apartamento} ${v.bloco}`,
                                    Proprietario: v.proprietario,
                                    Entrada: new Date(v.dataEntrada).toLocaleString(),
                                    Estacionado: 'Sim'
                                })),
                                ...historico.map(h => ({
                                    Vaga: h.vaga,
                                    Placa: h.placa,
                                    Modelo: h.veiculo,
                                    Apartamento: `AP ${h.apartamento} ${h.bloco}`,
                                    Proprietario: h.proprietario,
                                    Entrada: new Date(h.dataEntrada).toLocaleString(),
                                    Estacionado: 'Não'
                                }))
                            ];
                            // Sort by Vaga (numeric)
                            combined.sort((a, b) => Number(a.Vaga) - Number(b.Vaga));
                            printHTML(generateReportHTML("Relatório de Veículos", combined));
                        }}>
                            Gerar Relatório
                        </Button>
                        <hr className="border-gray-600" />
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="text-red-400 border-red-900 hover:bg-red-900/20" onClick={async () => { if (confirm("Zerar Histórico?")) { await limparHistorico(); loadData(); } }}>Zerar Hist.</Button>
                            <Button variant="outline" className="text-red-400 border-red-900 hover:bg-red-900/20" onClick={async () => { if (confirm("Zerar Mapa?")) { await limparAtivos(); loadData(); } }}>Zerar Mapa</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-navy-light border-gold">
                    <CardHeader><CardTitle className="text-gold flex gap-2"><Package /> Encomendas</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-gray-300">Total Registradas: {encomendas.length}</p>
                        <Button className="w-full bg-blue-600 text-white" onClick={() => {
                            const data = encomendas.map(e => ({
                                Data: new Date(e.data_chegada).toLocaleDateString(),
                                Chegada: new Date(e.data_chegada).toLocaleTimeString(),
                                Destinatario: e.destinatario || e.moradores?.nome_responsavel,
                                Apartamento: `AP ${e.apartamento} ${e.bloco}`,
                                Origem: e.origem,
                                Status: e.status,
                                Retirada: e.data_retirada ? new Date(e.data_retirada).toLocaleString() : '-',
                                Retirado_Por: e.retirado_por || '-',
                                Foto: e.foto_url // Trigger image render
                            }));
                            printHTML(generateReportHTML("Relatório de Encomendas", data));
                        }}>
                            Gerar Relatório
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const renderMoradores = () => (
        <div className="space-y-4 animate-in fade-in">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Buscar por Nome, AP ou Bloco..."
                        value={buscaMorador}
                        onChange={e => setBuscaMorador(e.target.value)}
                        className="pl-9 bg-white text-black"
                    />
                </div>
                <Button onClick={loadData}>Atualizar</Button>
            </div>

            <div className="bg-white rounded-lg overflow-x-auto shadow">
                <table className="w-full text-sm text-left text-gray-800">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="p-3">Unidade</th>
                            <th className="p-3">Responsável</th>
                            <th className="p-3 hidden md:table-cell">Veículos</th>
                            <th className="p-3 hidden md:table-cell">Contato</th>
                            <th className="p-3 text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {moradores.filter(m =>
                            m.nome_responsavel?.toLowerCase().includes(buscaMorador.toLowerCase()) ||
                            String(m.apartamento).includes(buscaMorador)
                        ).slice(0, 50).map(m => (
                            <tr key={m.id} className="hover:bg-gray-50">
                                <td className="p-3 font-bold">AP {m.apartamento} {m.bloco}</td>
                                <td className="p-3">{m.nome_responsavel}</td>
                                <td className="p-3 hidden md:table-cell text-xs text-gray-500">{m.carro_detalhes} {m.moto_detalhes}</td>
                                <td className="p-3 hidden md:table-cell text-xs">{m.whatsapp}</td>
                                <td className="p-3 text-right">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setSelectedItem(m); setModalType('morador'); }}>
                                        <Edit className="h-4 w-4 text-blue-600" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderEncomendas = () => (
        <div className="space-y-4 animate-in fade-in">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Buscar por Destinatário, AP ou Origem..."
                        value={buscaEncomenda}
                        onChange={e => setBuscaEncomenda(e.target.value)}
                        className="pl-9 bg-white text-black"
                    />
                </div>
                <Button onClick={loadData}>Atualizar</Button>
            </div>

            <div className="bg-white rounded-lg overflow-x-auto shadow">
                <table className="w-full text-sm text-left text-gray-800">
                    <thead className="bg-gray-100 text-gray-700">
                        <tr>
                            <th className="p-3">Data</th>
                            <th className="p-3">Destino</th>
                            <th className="p-3">Destinatário</th>
                            <th className="p-3">Origem</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {encomendas.filter(e =>
                            e.moradores?.nome_responsavel?.toLowerCase().includes(buscaEncomenda.toLowerCase()) ||
                            e.destinatario?.toLowerCase().includes(buscaEncomenda.toLowerCase()) ||
                            e.origem?.toLowerCase().includes(buscaEncomenda.toLowerCase()) ||
                            String(e.apartamento).includes(buscaEncomenda)
                        ).slice(0, 50).map(e => (
                            <tr key={e.id} className="hover:bg-gray-50">
                                <td className="p-3 text-xs text-gray-500">{new Date(e.data_chegada).toLocaleDateString()}</td>
                                <td className="p-3 font-bold">AP {e.apartamento}</td>
                                <td className="p-3">{e.destinatario}</td>
                                <td className="p-3">{e.origem}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${e.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                        {e.status}
                                    </span>
                                </td>
                                <td className="p-3 text-right">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setSelectedItem(e); setModalType('encomenda'); }}>
                                        <Edit className="h-4 w-4 text-blue-600" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gold">Painel Administrativo</h1>

            {renderTabs()}

            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'moradores' && renderMoradores()}
            {activeTab === 'encomendas' && renderEncomendas()}

            {selectedItem && (
                <DetailsModal
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    title={modalType === 'morador' ? "Detalhes do Morador" :
                        modalType === 'detalhes_solicitacao' ? "Detalhes da Solicitação" : "Detalhes da Encomenda"}
                    data={selectedItem}
                    type={modalType === 'detalhes_solicitacao' ? 'morador' : modalType} // Reuse morador display for generic details
                    readOnly={modalType === 'detalhes_solicitacao'}
                    onSave={modalType === 'morador' ? handleSaveMorador : (modalType === 'encomenda' ? handleSaveEncomenda : undefined)}
                    onDelete={modalType === 'morador' ? handleDeleteMorador : (modalType === 'encomenda' ? handleDeleteEncomenda : undefined)}
                />
            )}
        </div>
    );
}
