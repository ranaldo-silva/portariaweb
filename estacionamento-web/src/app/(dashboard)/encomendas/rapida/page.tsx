"use client";

import { useState, useEffect, useRef } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, Save, Search, Package, Check, Clock, X } from 'lucide-react';
import { DetailsModal } from '@/components/DetailsModal';
import { CameraAutoCapture } from '@/components/CameraAutoCapture';

export default function EncomendasRapida() {
    const { registrarEncomendaIncompleta, getEncomendasIncompletas, resolverEncomendaIncompleta, getMoradoresBase, salvarMoradorBase } = useStorage();

    const [loading, setLoading] = useState(false);
    const [fotoFile, setFotoFile] = useState<File | null>(null);
    const [descricao, setDescricao] = useState('');
    const [codigoRastreio, setCodigoRastreio] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [incompletas, setIncompletas] = useState<any[]>([]);
    const [identificando, setIdentificando] = useState<any>(null); // Item sendo identificado

    // Identification Form
    const [moradores, setMoradores] = useState<any[]>([]);
    const [searchMorador, setSearchMorador] = useState('');
    const [selectedMorador, setSelectedMorador] = useState<any>(null);
    const [destinatario, setDestinatario] = useState('');
    const [retiradoPor, setRetiradoPor] = useState('');

    const [showNovoMorador, setShowNovoMorador] = useState(false);
    const [formNovoMorador, setFormNovoMorador] = useState({
        id: '',
        nome: '',
        ap: '',
        bloco: '',
        modelo: '',
        moto: '',
        dependentes: '',
        whatsapp: '',
        cpf: ''
    });

    const carregar = async () => {
        const [inc, mor] = await Promise.all([getEncomendasIncompletas(), getMoradoresBase()]);
        setIncompletas(inc || []);
        setMoradores(mor || []);
    };

    useEffect(() => {
        setCodigoRastreio(Math.floor(1000 + Math.random() * 9000).toString());
        carregar();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setFotoFile(e.target.files[0]);
    };

    const handleSalvarRapido = async () => {
        if (!fotoFile && !descricao) {
            alert("Tire uma foto ou escreva uma descrição.");
            return;
        }
        setLoading(true);
        // Prepend the tracking code to the description seamlessly
        const novaDescricao = `[CÓD: ${codigoRastreio}] ${descricao}`.trim();

        // Porteiro hardcoded or from auth? 'Portaria' for now as usually generic user
        const ok = await registrarEncomendaIncompleta({ fotoFile: fotoFile || undefined, descricao: novaDescricao, porteiro: 'Portaria' });
        if (ok) {
            alert(`✅ Salvo com sucesso!\n\n⚠️ ESCREVA O CÓDIGO [ ${codigoRastreio} ] NA ENCOMENDA.`);
            setFotoFile(null);
            setDescricao('');
            setCodigoRastreio(Math.floor(1000 + Math.random() * 9000).toString());
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
        setShowNovoMorador(false);
    };

    const handleSalvarNovoMorador = async () => {
        if (!formNovoMorador.nome) { alert("Nome obrigatório"); return; }
        setLoading(true);

        const ok = await salvarMoradorBase(formNovoMorador);
        if (ok) {
            alert("Unidade cadastrada com sucesso!");

            // Recarrega moradores para obter o novo
            const mList = await getMoradoresBase();
            if (mList) setMoradores(mList);

            const novo = mList?.find((m: any) =>
                m.nome_responsavel === formNovoMorador.nome &&
                String(m.apartamento) === String(formNovoMorador.ap) &&
                m.bloco === formNovoMorador.bloco
            );

            if (novo) {
                setSelectedMorador(novo);
                setSearchMorador(novo.nome_responsavel);
            }

            setShowNovoMorador(false);
            setFormNovoMorador({ id: '', nome: '', ap: '', bloco: '', modelo: '', moto: '', dependentes: '', whatsapp: '', cpf: '' });
        } else {
            alert("Erro ao cadastrar unidade.");
        }
        setLoading(false);
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
                <Card className="bg-navy-light border-gold/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-gold text-navy font-black text-2xl font-mono px-4 py-2 rounded-bl-xl shadow-lg border-b-2 border-l-2 border-gold-hover">
                        {codigoRastreio}
                    </div>
                    <CardHeader className="pr-24">
                        <CardTitle className="text-gold flex items-center gap-2"><Clock /> Encomendas</CardTitle>
                        <CardDescription>Escreva o código <strong className="text-white bg-gray-800 px-1 rounded">{codigoRastreio}</strong> na embalagem e registre os dados e a foto.</CardDescription>
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
                    <Card className="w-full max-w-lg bg-white text-black animate-in fade-in zoom-in relative">
                        {/* Close Button X */}
                        <button
                            onClick={() => setIdentificando(null)}
                            className="absolute right-4 top-4 text-gray-500 hover:text-black hover:bg-gray-100 p-1 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <CardHeader className="border-b">
                            <CardTitle>Identificar Encomenda</CardTitle>
                            <CardDescription>Vincule esta encomenda a um morador para dar baixa.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            {showNovoMorador ? (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg text-navy border-b pb-2">Nova Unidade</h3>
                                    <Input placeholder="Nome Responsável" value={formNovoMorador.nome} onChange={e => setFormNovoMorador({ ...formNovoMorador, nome: e.target.value })} className="bg-white text-black" />
                                    <Input placeholder="CPF (Apenas números)" value={formNovoMorador.cpf} onChange={e => setFormNovoMorador({ ...formNovoMorador, cpf: e.target.value })} className="bg-white text-black" />

                                    <div className="grid grid-cols-2 gap-4">
                                        <Input placeholder="Carro (Modelo, Placa)" value={formNovoMorador.modelo} onChange={e => setFormNovoMorador({ ...formNovoMorador, modelo: e.target.value })} className="bg-white text-black" />
                                        <Input placeholder="Moto (Modelo, Placa)" value={formNovoMorador.moto} onChange={e => setFormNovoMorador({ ...formNovoMorador, moto: e.target.value })} className="bg-white text-black" />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <Input placeholder="AP" type="number" value={formNovoMorador.ap} onChange={e => setFormNovoMorador({ ...formNovoMorador, ap: e.target.value })} className="bg-white text-black" />
                                        <Input placeholder="Bloco" value={formNovoMorador.bloco} onChange={e => setFormNovoMorador({ ...formNovoMorador, bloco: e.target.value.toUpperCase() })} className="bg-white text-black" />
                                        <Input placeholder="WhatsApp" value={formNovoMorador.whatsapp} onChange={e => setFormNovoMorador({ ...formNovoMorador, whatsapp: e.target.value })} className="bg-white text-black" />
                                    </div>

                                    <textarea
                                        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-black min-h-[80px]"
                                        placeholder="Dependentes (separados por vírgula)"
                                        value={formNovoMorador.dependentes}
                                        onChange={e => setFormNovoMorador({ ...formNovoMorador, dependentes: e.target.value })}
                                    />

                                    <div className="flex gap-2 justify-end pt-2">
                                        <Button variant="ghost" onClick={() => setShowNovoMorador(false)}>Voltar</Button>
                                        <Button className="bg-gold hover:bg-gold-hover text-navy font-bold" onClick={handleSalvarNovoMorador} disabled={loading}>
                                            <Save size={18} className="mr-2" /> SALVAR UNIDADE
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* 1. Search Resident */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-sm font-bold text-gray-700">Buscar Unidade</label>
                                            <Button variant="link" className="text-blue-600 h-auto p-0 text-sm" onClick={() => setShowNovoMorador(true)}>
                                                + Cadastrar Nova Unidade
                                            </Button>
                                        </div>
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
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
