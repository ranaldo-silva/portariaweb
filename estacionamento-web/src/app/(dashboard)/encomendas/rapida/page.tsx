"use client";

import { useState, useEffect, useRef } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, Save, Search, Package, Check, Clock } from 'lucide-react';
import { DetailsModal } from '@/components/DetailsModal';
import { CameraAutoCapture } from '@/components/CameraAutoCapture';

export default function EncomendasRapida() {
    const { registrarEncomendaIncompleta, getEncomendasIncompletas, resolverEncomendaIncompleta, getMoradoresBase } = useStorage();

    const [loading, setLoading] = useState(false);
    const [fotoFile, setFotoFile] = useState<File | null>(null);
    const [descricao, setDescricao] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [incompletas, setIncompletas] = useState<any[]>([]);
    const [identificando, setIdentificando] = useState<any>(null); // Item sendo identificado

    // Identification Form
    const [moradores, setMoradores] = useState<any[]>([]);
    const [searchMorador, setSearchMorador] = useState('');
    const [selectedMorador, setSelectedMorador] = useState<any>(null);
    const [destinatario, setDestinatario] = useState('');
    const [retiradoPor, setRetiradoPor] = useState('');

    const carregar = async () => {
        const [inc, mor] = await Promise.all([getEncomendasIncompletas(), getMoradoresBase()]);
        setIncompletas(inc || []);
        setMoradores(mor || []);
    };

    useEffect(() => { carregar(); }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setFotoFile(e.target.files[0]);
    };

    const handleSalvarRapido = async () => {
        if (!fotoFile && !descricao) {
            alert("Tire uma foto ou escreva uma descrição.");
            return;
        }
        setLoading(true);
        // Porteiro hardcoded or from auth? 'Portaria' for now as usually generic user
        const ok = await registrarEncomendaIncompleta({ fotoFile: fotoFile || undefined, descricao, porteiro: 'Portaria' });
        if (ok) {
            alert("Salvo!");
            setFotoFile(null);
            setDescricao('');
            carregar();
        } else {
            alert("Erro ao salvar.");
        }
        setLoading(false);
    };

    const handleIniciarIdentificacao = (item: any) => {
        setIdentificando(item);
        setSearchMorador('');
        setSelectedMorador(null);
        setDestinatario('');
        setRetiradoPor('');
    };

    const handleConfirmarIdentificacao = async () => {
        if (!selectedMorador || !destinatario || !retiradoPor) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }

        if (confirm("Confirmar identificação e retirada da encomenda?")) {
            setLoading(true);
            const ok = await resolverEncomendaIncompleta(identificando.id, {
                moradorId: selectedMorador.id,
                destinatario: destinatario,
                descricao: identificando.descricao || "Encomenda Identificada",
                fotoUrl: identificando.foto_url,
                retiradoPor: retiradoPor
            });

            if (ok) {
                alert("Encomenda identificada e atualizada com sucesso!");
                setIdentificando(null);
                carregar();
            } else {
                alert("Erro ao atualizar.");
            }
            setLoading(false);
        }
    };

    const filtrados = moradores.filter(m =>
        (m.nome_responsavel || "").toLowerCase().includes(searchMorador.toLowerCase()) ||
        String(m.apartamento).includes(searchMorador)
    ).slice(0, 5);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto pb-20">
            {/* LEFT: Quick Capture */}
            <div className="space-y-6">
                <Card className="bg-navy-light border-gold/50">
                    <CardHeader>
                        <CardTitle className="text-gold flex items-center gap-2"><Clock /> Recebimento Rápido</CardTitle>
                        <CardDescription>Registre encomendas sem dados completos para processar depois.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <CameraAutoCapture onCapture={file => setFotoFile(file)} accept="image/*" capture="environment">
                            <div
                                className="border-2 border-dashed border-gold/30 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-navy/50 transition-colors bg-black/20"
                            >
                                {fotoFile ? (
                                    <div className="text-center">
                                        <p className="text-gold font-bold">{fotoFile.name}</p>
                                        <p className="text-xs text-gray-400">Clique para alterar</p>
                                    </div>
                                ) : (
                                    <>
                                        <Camera size={40} className="text-gold mb-2" />
                                        <p className="text-gray-400">Tirar Foto (Opcional)</p>
                                    </>
                                )}
                            </div>
                        </CameraAutoCapture>

                        <Input
                            placeholder="Descrição rápida (ex: Caixa Amazon rasgada)"
                            value={descricao}
                            onChange={e => setDescricao(e.target.value)}
                            className="bg-white text-black"
                        />

                        <Button className="w-full bg-gold text-navy font-bold hover:bg-gold-hover h-12" onClick={handleSalvarRapido} disabled={loading}>
                            <Save className="mr-2" /> {loading ? "SALVANDO..." : "SALVAR RÁPIDO"}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT: List of Incomplete */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white flex gap-2 items-center">
                    Pendentes de Identificação
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{incompletas.length}</span>
                </h2>

                <div className="space-y-3 max-h-[80vh] overflow-y-auto">
                    {incompletas.map(item => (
                        <Card key={item.id} className="bg-white border-none">
                            <CardContent className="p-4 flex gap-4">
                                {item.foto_url ? (
                                    <img src={item.foto_url} className="w-20 h-20 object-cover rounded bg-gray-200" />
                                ) : (
                                    <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                                        <Package />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <p className="font-bold text-navy">{item.descricao || "Sem descrição"}</p>
                                    <p className="text-xs text-gray-500">{new Date(item.data_chegada).toLocaleString()}</p>
                                    <p className="text-xs text-gray-400 mt-1">Por: {item.registrado_por}</p>

                                    <Button size="sm" className="mt-2 bg-blue-600 w-full" onClick={() => handleIniciarIdentificacao(item)}>
                                        IDENTIFICAR & ENTREGAR
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {incompletas.length === 0 && <p className="text-gray-400 italic">Nenhuma pendência.</p>}
                </div>
            </div>

            {/* IDENTIFICATION MODAL (Custom implementation for speed) */}
            {identificando && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <Card className="w-full max-w-lg bg-white text-black animate-in fade-in zoom-in">
                        <CardHeader className="border-b">
                            <CardTitle>Identificar Encomenda</CardTitle>
                            <CardDescription>Vincule esta encomenda a um morador para dar baixa.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            {/* 1. Search Resident */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Buscar Unidade</label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                        placeholder="Digite Ap ou Nome"
                                        value={searchMorador}
                                        onChange={e => setSearchMorador(e.target.value)}
                                        className="pl-9"
                                    />
                                    {searchMorador.length > 0 && !selectedMorador && (
                                        <div className="absolute z-10 w-full bg-white border mt-1 shadow-xl max-h-40 overflow-y-auto rounded-md text-black">
                                            {filtrados.map(m => (
                                                <div
                                                    key={m.id}
                                                    className="p-2 hover:bg-blue-50 cursor-pointer border-b"
                                                    onClick={() => {
                                                        setSelectedMorador(m);
                                                        setSearchMorador(m.nome_responsavel);
                                                    }}
                                                >
                                                    <strong>{m.nome_responsavel}</strong> (AP {m.apartamento} {m.bloco})
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedMorador && (
                                <div className="bg-blue-50 p-2 rounded border border-blue-200 text-sm text-blue-900">
                                    Selecionado: <strong>{selectedMorador.nome_responsavel}</strong> - {selectedMorador.apartamento} {selectedMorador.bloco}
                                </div>
                            )}

                            {/* 2. Destinatario Real */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Destinatário (Nome na Caixa)</label>
                                <Input
                                    value={destinatario}
                                    onChange={e => setDestinatario(e.target.value)}
                                    placeholder="Ex: João da Silva"
                                />
                                <p className="text-xs text-blue-600">
                                    * Se este nome não existir no cadastro, será solicitada inclusão automaticamente.
                                </p>
                            </div>

                            {/* 3. Retirado Por */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Retirado Por</label>
                                <Input
                                    value={retiradoPor}
                                    onChange={e => setRetiradoPor(e.target.value)}
                                    placeholder="Quem pegou a caixa?"
                                />
                            </div>

                            <div className="flex gap-2 justify-end pt-4">
                                <Button variant="ghost" onClick={() => setIdentificando(null)}>Cancelar</Button>
                                <Button className="bg-green-600 hover:bg-green-700" onClick={handleConfirmarIdentificacao} disabled={loading}>
                                    <Check className="mr-2" /> {loading ? "Processando..." : "Concluir"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
