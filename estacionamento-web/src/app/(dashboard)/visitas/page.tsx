"use client";

"use client";

import { useState, useRef, useEffect } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserCog, Camera, Trash2, Users } from 'lucide-react';
import { DetailsModal } from '@/components/DetailsModal';
import { CameraAutoCapture } from '@/components/CameraAutoCapture';

export default function Visitas() {
    const { registrarVisita, getVisitas, removerVisita, getVisitasAgendadas, concluirAgendamento } = useStorage();

    const [nome, setNome] = useState('');
    const [documento, setDocumento] = useState('');
    const [apartamento, setApartamento] = useState('');
    const [bloco, setBloco] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [fotoFile, setFotoFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const [lista, setLista] = useState<any[]>([]);
    const [agendadas, setAgendadas] = useState<any[]>([]);
    const [itemDetalhes, setItemDetalhes] = useState<any>(null);
    const [selectedAgendamentoId, setSelectedAgendamentoId] = useState<string | null>(null);

    const carregar = async () => {
        const dados = await getVisitas();
        setLista(dados || []);
        const agend = await getVisitasAgendadas();
        setAgendadas(agend || []);
    };
    useEffect(() => { carregar(); }, []);

    const handleSalvar = async () => {
        if (!nome || !apartamento) return alert("Nome e Apartamento obrigatórios");
        setLoading(true);

        const dados = {
            nome,
            documento,
            apartamento,
            bloco,
            observacoes,
            dataHora: new Date().toISOString(),
            fotoFile
        };

        const ok = await registrarVisita(dados);
        if (ok) {
            if (selectedAgendamentoId) {
                await concluirAgendamento(selectedAgendamentoId);
            }
            alert("Visita registrada!");
            setNome(''); setDocumento(''); setApartamento(''); setBloco(''); setObservacoes(''); setFotoFile(null); setSelectedAgendamentoId(null);
            carregar();
        } else {
            alert("Erro ao registrar.");
        }
        setLoading(false);
    };

    const handlePreencher = (agendamento: any) => {
        setNome(agendamento.visitante_nome);
        setDocumento(agendamento.documento || "");
        setApartamento(String(agendamento.moradores?.apartamento || ""));
        setBloco(agendamento.moradores?.bloco || "");
        setObservacoes(agendamento.observacoes || "");
        setSelectedAgendamentoId(agendamento.id);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <Card className="bg-navy-light border-gold h-fit">
                    <CardHeader>
                        <CardTitle className="text-gold flex items-center gap-2"><UserCog /> Registrar Visita</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input placeholder="Nome Visitante" value={nome} onChange={e => setNome(e.target.value)} className="bg-white text-black" />
                        <Input placeholder="Documento (RG/CPF)" value={documento} onChange={e => setDocumento(e.target.value)} className="bg-white text-black" />
                        <Input placeholder="Observações (Opcional)" value={observacoes} onChange={e => setObservacoes(e.target.value)} className="bg-white text-black" />

                        <div className="grid grid-cols-2 gap-4">
                            <Input placeholder="AP" type="number" value={apartamento} onChange={e => setApartamento(e.target.value)} className="bg-white text-black" />
                            <Input placeholder="Bloco" value={bloco} onChange={e => setBloco(e.target.value.toUpperCase())} className="bg-white text-black" />
                        </div>

                        <CameraAutoCapture onCapture={file => setFotoFile(file)} accept="image/*" capture="user">
                            <div
                                className="border-2 border-dashed border-gold/50 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-navy/50 transition-colors relative"
                            >
                                <Camera size={32} className="text-gold mb-2" />
                                <p className="text-gray-400 text-sm">{fotoFile ? "Foto Capturada" : "Foto Visitante (Opcional)"}</p>
                            </div>
                        </CameraAutoCapture>

                        <Button className="w-full bg-success text-white font-bold h-12" onClick={handleSalvar} disabled={loading}>
                            {loading ? "REGISTRANDO..." : "REGISTRAR ENTRADA"}
                        </Button>
                    </CardContent>
                </Card>

                {/* VISITAS AGENDADAS */}
                {agendadas.length > 0 && (
                    <Card className="bg-navy border border-green-500/50">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-green-400 text-lg flex items-center gap-2">
                                <Users size={18} /> Visitantes Aguardados
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {agendadas.map(a => (
                                <div
                                    key={a.id}
                                    className="p-3 bg-navy-light border border-green-500/30 rounded cursor-pointer hover:bg-green-500/10 transition-colors flex justify-between items-center"
                                    onClick={() => handlePreencher(a)}
                                >
                                    <div>
                                        <p className="font-bold text-white">{a.visitante_nome}</p>
                                        <p className="text-xs text-gray-400">AP {a.moradores?.apartamento} {a.moradores?.bloco} - {a.documento}</p>
                                        {a.observacoes && <p className="text-xs text-yellow-500 italic mt-1">Obs: {a.observacoes}</p>}
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-green-400 h-8">
                                        Selecionar
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* LISTA VISITAS */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-4">Últimas Visitas</h2>
                <div className="space-y-3 max-h-[80vh] overflow-y-auto">
                    {lista.map(v => (
                        <Card key={v.id} className="bg-navy border border-gray-700 hover:bg-navy/50 cursor-pointer">
                            <CardContent className="p-4 flex items-center gap-3" onClick={() => setItemDetalhes(v)}>
                                {v.foto_url ? (
                                    <img src={v.foto_url} className="w-12 h-12 rounded-full object-cover border border-gold" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-navy-light flex items-center justify-center border border-gold">
                                        <UserCog className="text-gold" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h4 className="font-bold text-white">{v.visitante_nome}</h4>
                                    <p className="text-sm text-gold">Visita ao AP {v.apartamento} {v.bloco}</p>
                                    <p className="text-xs text-gray-400">{new Date(v.data_visita).toLocaleString()} {v.documento && `| Doc: ${v.documento}`}</p>
                                    {v.observacoes && <p className="text-xs text-yellow-500 italic mt-1">Obs: {v.observacoes}</p>}
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (confirm("Excluir Reg. Visita?")) {
                                            await removerVisita(v.id);
                                            carregar();
                                        }
                                    }}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <DetailsModal
                isOpen={!!itemDetalhes}
                onClose={() => setItemDetalhes(null)}
                title="Detalhes da Visita"
                data={itemDetalhes}
                type="visita"
            />
        </div>
    );
}
