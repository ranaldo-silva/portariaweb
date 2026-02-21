"use client";

import { useState, useEffect, useRef } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, HardHat, Camera } from 'lucide-react';

import { Trash2 } from 'lucide-react';
import { DetailsModal } from '@/components/DetailsModal';
import { CameraAutoCapture } from '@/components/CameraAutoCapture';

export default function Prestadores() {
    const { salvarPrestador, getPrestadores, removerPrestador } = useStorage();

    const [nome, setNome] = useState('');
    const [documento, setDocumento] = useState('');
    const [tipo, setTipo] = useState('');
    const [telefone, setTelefone] = useState('');
    const [fotoFile, setFotoFile] = useState<File | null>(null);
    const [docFile, setDocFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const [lista, setLista] = useState<any[]>([]);
    const [pesquisa, setPesquisa] = useState('');
    const [itemDetalhes, setItemDetalhes] = useState<any>(null); // Details state

    const tiposComuns = ["Eletricista", "Encanador", "Pedreiro", "Pintor", "Jardineiro", "Limpeza", "Outro"];

    const carregar = async () => {
        const dados = await getPrestadores();
        setLista(dados || []);
    };
    useEffect(() => { carregar(); }, []);

    const handleSalvar = async () => {
        if (!nome || !tipo) return alert("Nome e Tipo obrigatórios");
        setLoading(true);

        const dados = { nome, tipo, telefone, documento, fotoFile, docFile };
        const ok = await salvarPrestador(dados);

        if (ok) {
            alert("Cadastrado!");
            setNome(''); setDocumento(''); setTipo(''); setTelefone(''); setFotoFile(null); setDocFile(null);
            carregar();
        } else {
            alert("Erro ao salvar.");
        }
        setLoading(false);
    };

    const filtrados = lista.filter(p =>
        p.nome?.toLowerCase().includes(pesquisa.toLowerCase()) ||
        p.documento?.includes(pesquisa)
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-navy-light border-gold h-fit">
                <CardHeader>
                    <CardTitle className="text-gold flex items-center gap-2"><HardHat /> Cadastro Prestador</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input placeholder="Nome Completo" value={nome} onChange={e => setNome(e.target.value)} className="bg-white text-black" />
                    <Input placeholder="Documento (RG/CPF)" value={documento} onChange={e => setDocumento(e.target.value)} className="bg-white text-black" />

                    <div>
                        <p className="text-sm text-gray-300 mb-2">Tipo de Serviço:</p>
                        <div className="flex flex-wrap gap-2">
                            {tiposComuns.map(t => (
                                <Button
                                    key={t}
                                    size="sm"
                                    variant={tipo === t ? "default" : "outline"}
                                    onClick={() => setTipo(t)}
                                    className={tipo === t ? "bg-white text-black" : "text-gray-300 border-gray-600"}
                                >
                                    {t}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <Input placeholder="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} className="bg-white text-black" />

                    <div className="grid grid-cols-2 gap-4">
                        <CameraAutoCapture onCapture={file => setFotoFile(file)} accept="image/*" capture="user">
                            <div className="border border-dashed border-gold/50 rounded p-4 text-center cursor-pointer hover:bg-navy/50 relative">
                                <Camera className="mx-auto text-gold mb-2" />
                                <p className="text-xs text-gray-400">{fotoFile ? "Foto selecionada" : "Foto Rosto"}</p>
                            </div>
                        </CameraAutoCapture>
                        <CameraAutoCapture onCapture={file => setDocFile(file)} accept="image/*" capture="environment">
                            <div className="border border-dashed border-gold/50 rounded p-4 text-center cursor-pointer hover:bg-navy/50 relative">
                                <Camera className="mx-auto text-gold mb-2" />
                                <p className="text-xs text-gray-400">{docFile ? "Doc selecionado" : "Foto Doc"}</p>
                            </div>
                        </CameraAutoCapture>
                    </div>

                    <Button className="w-full bg-gold text-navy font-bold" onClick={handleSalvar} disabled={loading}>
                        {loading ? "SALVANDO..." : "CADASTRAR"}
                    </Button>
                </CardContent>
            </Card>

            {/* LISTA */}
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Buscar prestador..."
                        value={pesquisa}
                        onChange={e => setPesquisa(e.target.value)}
                        className="pl-9 bg-navy-light border-gold/30 text-white placeholder:text-gray-400"
                    />
                </div>

                <div className="space-y-3 max-h-[80vh] overflow-y-auto">
                    {filtrados.map(p => (
                        <Card key={p.id} className="bg-navy border border-gray-700 hover:bg-navy/50 cursor-pointer">
                            <CardContent className="p-4 flex items-center gap-3" onClick={() => setItemDetalhes(p)}>
                                {p.foto_url ? (
                                    <img src={p.foto_url} className="w-12 h-12 rounded-full object-cover border border-gold" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-navy-light flex items-center justify-center border border-gold">
                                        <HardHat className="text-gold" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h4 className="font-bold text-white">{p.nome}</h4>
                                    <p className="text-sm text-gold">{p.tipo_servico}</p>
                                    <p className="text-xs text-gray-400">Doc: {p.documento || "---"}</p>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-red-500 hover:bg-red-50"
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (confirm("Excluir Prestador?")) {
                                            await removerPrestador(p.id);
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
                title="Detalhes do Prestador"
                data={itemDetalhes}
                type="prestador"
            />
        </div>
    );
}
