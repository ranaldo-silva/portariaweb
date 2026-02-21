"use client";

import { useState, useEffect, useRef } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge'; // Wait, I didn't create Badge, I'll inline styles
import { Search, Camera, Send, Package, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DetailsModal } from '@/components/DetailsModal';
import { CameraAutoCapture } from '@/components/CameraAutoCapture';

export default function Encomendas() {
    const { getMoradoresBase, registrarEncomenda, getEncomendasAtivas, validarTokenRetirada, removerEncomenda } = useStorage();

    const [busca, setBusca] = useState('');
    const [moradores, setMoradores] = useState<any[]>([]);
    const [moradorSel, setMoradorSel] = useState<any>(null);
    const [destinatarioFinal, setDestinatarioFinal] = useState('');
    const [origem, setOrigem] = useState('');
    const [fotoFile, setFotoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [encomendasPendentes, setEncomendasPendentes] = useState<any[]>([]);
    const [itemDetalhes, setItemDetalhes] = useState<any>(null); // Details state
    const [tokenDigitado, setTokenDigitado] = useState('');
    const [loading, setLoading] = useState(false);
    const [notificarWhats, setNotificarWhats] = useState(true);

    const origensComuns = ["Shopee", "Mercado Livre", "Shein", "Amazon", "Correios", "99Food", "KeeTa", "Transportadora"];

    const carregarDados = async () => {
        const [m, e] = await Promise.all([getMoradoresBase(), getEncomendasAtivas()]);
        setMoradores(m || []);
        setEncomendasPendentes(e || []);
    };

    useEffect(() => { carregarDados(); }, []);

    const obterMoradoresUnicos = (responsavel: any) => {
        if (!responsavel) return [];
        const listaRaw = responsavel.lista_moradores ? responsavel.lista_moradores.split(',') : [];
        const dependentesLimpis = listaRaw
            .map((n: string) => n.trim())
            .filter((n: string) => n !== "" && n.toLowerCase() !== responsavel.nome_responsavel.toLowerCase());
        return [...new Set(dependentesLimpis)];
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFotoFile(e.target.files[0]);
        }
    };

    const handleRegistrar = async () => {
        if (!moradorSel || !origem || !destinatarioFinal) {
            alert("Selecione morador, destinatário e origem.");
            return;
        }
        setLoading(true);
        const token = Math.floor(1000 + Math.random() * 9000).toString();
        const sucesso = await registrarEncomenda(moradorSel, origem, token, fotoFile, destinatarioFinal);

        if (sucesso) {
            const mensagem = `📦 *ENCOMENDA NA PORTARIA*\n\nOlá, *${destinatarioFinal}*.\nSua encomenda da *${origem}* chegou.\n\n🔐 *TOKEN PARA RETIRADA:* ${token}`;
            const url = `https://wa.me/55${moradorSel.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(mensagem)}`;



            if (notificarWhats) {
                window.open(url, '_blank');
            }

            setMoradorSel(null);
            setDestinatarioFinal('');
            setOrigem('');
            setBusca('');
            setFotoFile(null);
            carregarDados();
        } else {
            alert("Erro ao registrar.");
        }
        setLoading(false);
    };

    const handleBaixa = async (id: string, tokenReal: string) => {
        const tokenInput = prompt("Digite o TOKEN ou CPF para retirada:");
        if (!tokenInput) return;

        const res = await validarTokenRetirada(id, tokenInput);
        if (res.sucesso) {
            alert("Entrega confirmada!");
            carregarDados();
        } else {
            alert(res.msg);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* REGISTRO */}
            <Card className="bg-navy-light border-gold border h-fit">
                <CardHeader>
                    <CardTitle className="text-gold flex items-center gap-2"><Package /> Nova Encomenda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Busca Morador */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Buscar Morador ou AP..."
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="pl-9 bg-white text-black"
                        />
                        {busca.length > 0 && !moradorSel && (
                            <div className="absolute z-10 w-full bg-white border mt-1 rounded shadow-lg max-h-40 overflow-y-auto">
                                {moradores
                                    .filter(m => String(m.nome_responsavel || "").toLowerCase().includes(busca.toLowerCase()) || String(m.apartamento).includes(busca))
                                    .slice(0, 5)
                                    .map(m => (
                                        <div
                                            key={m.id}
                                            className="p-2 hover:bg-gray-100 cursor-pointer text-black border-b"
                                            onClick={() => { setMoradorSel(m); setDestinatarioFinal(m.nome_responsavel); setBusca(m.nome_responsavel); }}
                                        >
                                            <strong>{m.nome_responsavel}</strong>
                                            <div className="text-xs text-gray-500">AP: {m.apartamento} {m.bloco}</div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* Detalhes do Morador */}
                    {moradorSel && (
                        <div className="bg-navy p-3 rounded border border-gold/30">
                            <p className="text-sm text-gray-300 mb-2">Quem vai retirar?</p>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant={destinatarioFinal === moradorSel.nome_responsavel ? "default" : "secondary"}
                                    onClick={() => setDestinatarioFinal(moradorSel.nome_responsavel)}
                                >
                                    {moradorSel.nome_responsavel} (Titular)
                                </Button>
                                {/* @ts-ignore */}
                                {obterMoradoresUnicos(moradorSel).map((dep: any) => (
                                    <Button
                                        key={dep}
                                        size="sm"
                                        variant={destinatarioFinal === dep ? "default" : "secondary"}
                                        onClick={() => setDestinatarioFinal(dep)}
                                    >
                                        {dep}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Origem */}
                    <div>
                        <p className="text-sm text-gray-300 mb-2">Origem:</p>
                        <div className="flex flex-wrap gap-2">
                            {origensComuns.map(item => (
                                <Button
                                    key={item}
                                    size="sm"
                                    variant={origem === item ? "default" : "outline"}
                                    onClick={() => setOrigem(item)}
                                    className={origem === item ? "bg-white text-black hover:bg-gray-200" : "text-gray-300 border-gray-600"}
                                >
                                    {item}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Foto */}
                    <CameraAutoCapture onCapture={file => setFotoFile(file)} accept="image/*" capture="environment">
                        <div
                            className="border-2 border-dashed border-gold/50 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-navy/50 transition-colors"
                        >
                            {fotoFile ? (
                                <div className="text-center">
                                    <p className="text-gold font-bold">{fotoFile.name}</p>
                                    <p className="text-xs text-gray-400">Clique para alterar</p>
                                </div>
                            ) : (
                                <>
                                    <Camera size={32} className="text-gold mb-2" />
                                    <p className="text-gray-400 text-sm">Tirar foto da etiqueta</p>
                                </>
                            )}
                        </div>
                    </CameraAutoCapture>

                    <div className="flex items-center gap-2 px-1">
                        <input
                            type="checkbox"
                            id="notificar"
                            checked={notificarWhats}
                            onChange={(e) => setNotificarWhats(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-gold focus:ring-gold accent-gold cursor-pointer"
                        />
                        <label htmlFor="notificar" className="text-sm text-gray-300 cursor-pointer select-none">
                            Enviar notificação via WhatsApp
                        </label>
                    </div>

                    <Button
                        className="w-full bg-success text-white font-bold h-12"
                        onClick={handleRegistrar}
                        disabled={loading}
                    >
                        <Send className="mr-2" size={18} />
                        {loading ? "ENVIANDO..." : (notificarWhats ? "NOTIFICAR WHATSAPP" : "REGISTRAR ENCOMENDA")}
                    </Button>
                </CardContent>
            </Card>

            {/* LISTA PENDENTES */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-4">Na Portaria ({encomendasPendentes.length})</h2>
                {encomendasPendentes.length === 0 && <p className="text-gray-500">Nenhuma encomenda pendente.</p>}

                <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-2">
                    {encomendasPendentes.map(enc => (
                        <Card key={enc.id} className="bg-white border-none shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                            <CardContent className="p-4 flex items-center gap-3" onClick={() => setItemDetalhes(enc)}>
                                {enc.foto_url ? (
                                    <img src={enc.foto_url} className="w-12 h-12 rounded object-cover bg-gray-200" alt="Pacote" />
                                ) : (
                                    <div className="w-12 h-12 rounded bg-navy-light flex items-center justify-center text-gold">
                                        <Package size={24} />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-navy truncate">{enc.moradores?.nome_responsavel || "Desconhecido"}</h4>
                                    <p className="text-sm text-gray-600 truncate">Origem: {enc.origem} • AP {enc.apartamento}</p>
                                    {enc.destinatario && <p className="text-xs text-blue-600 font-bold">Para: {enc.destinatario}</p>}
                                    <p className="text-xs text-gray-400">{new Date(enc.data_chegada).toLocaleString()}</p>
                                </div>
                            </CardContent>
                            {/* Actions outside onClick to avoid triggering modal */}
                            <div className="flex flex-col gap-2 p-2 pt-0 z-10">
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8" onClick={(e) => { e.stopPropagation(); handleBaixa(enc.id, enc.token); }}>
                                    BAIXA
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm("Excluir encomenda?")) {
                                        await removerEncomenda(enc.id);
                                        carregarDados();
                                    }
                                }}>
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            <DetailsModal
                isOpen={!!itemDetalhes}
                onClose={() => setItemDetalhes(null)}
                title="Detalhes da Encomenda"
                data={itemDetalhes}
                type="encomenda"
            />
        </div >
    );
}
