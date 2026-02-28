"use client";

import { useState, useEffect, useRef } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge'; // Wait, I didn't create Badge, I'll inline styles
import { Search, Camera, Send, Package, Check, Trash2, FileText, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateReportHTML, printHTML, shareReportViaWhatsApp } from '@/lib/print';
import { DetailsModal } from '@/components/DetailsModal';
import { CameraAutoCapture } from '@/components/CameraAutoCapture';
import { ReceiptTemplate } from '@/components/ReceiptTemplate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function Encomendas() {
    const { getMoradoresBase, registrarEncomenda, registrarEncomendaAvulsa, getEncomendasAtivas, validarTokenRetirada, removerEncomenda, darBaixaEncomendaPorFoto, getTodasEncomendas } = useStorage();

    const [busca, setBusca] = useState('');
    const [moradores, setMoradores] = useState<any[]>([]);
    const [moradorSel, setMoradorSel] = useState<any>(null);
    const [destinatarioFinal, setDestinatarioFinal] = useState('');
    const [origem, setOrigem] = useState('');
    const [fotoFile, setFotoFile] = useState<File | null>(null);

    const [filtroAp, setFiltroAp] = useState('');
    const [filtroBloco, setFiltroBloco] = useState('');
    const [novoAp, setNovoAp] = useState('');
    const [novoBloco, setNovoBloco] = useState('');
    const [mostrarAvulso, setMostrarAvulso] = useState(false);

    const [userRole, setUserRole] = useState<string>('');
    useEffect(() => {
        setUserRole(localStorage.getItem('userRole') || '');
    }, []);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    const [encomendasPendentes, setEncomendasPendentes] = useState<any[]>([]);
    const [itemDetalhes, setItemDetalhes] = useState<any>(null); // Details state
    const [tokenDigitado, setTokenDigitado] = useState('');
    const [loading, setLoading] = useState(false);
    const [notificarWhats, setNotificarWhats] = useState(false);
    const [reciboGerado, setReciboGerado] = useState<any>(null); // State for the success view

    const [baixaFotoModalItem, setBaixaFotoModalItem] = useState<any>(null);
    const [baixaNomeRecebedor, setBaixaNomeRecebedor] = useState('');
    const [baixaCpfRecebedor, setBaixaCpfRecebedor] = useState('');
    const [baixaFinalizaCadastro, setBaixaFinalizaCadastro] = useState(false);
    const [baixaLoteIds, setBaixaLoteIds] = useState<string[]>([]);
    const [baixaProcessando, setBaixaProcessando] = useState(false);

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
        if (!origem || !destinatarioFinal) {
            alert("Selecione destinatário e origem.");
            return;
        }
        if (!moradorSel && (!novoAp)) {
            alert("Preencha o apartamento do morador avulso ou selecione um morador na busca.");
            return;
        }

        // --- VALIDAÇÃO DE DUPLICIDADE AVULSO ---
        if (!moradorSel && novoAp) {
            const existeNaBase = moradores.find(m =>
                String(m.apartamento) === novoAp &&
                (m.bloco || "").toLowerCase() === (novoBloco || "").toLowerCase()
            );

            if (existeNaBase) {
                alert(`Atenção: A unidade AP ${existeNaBase.apartamento} ${existeNaBase.bloco ? `Bloco ${existeNaBase.bloco}` : ''} já possui cadastro no sistema como "${existeNaBase.nome_responsavel}". Por favor, busque na barra de pesquisa e selecione o morador existente.`);
                return;
            }
        }
        // ----------------------------------------

        setLoading(true);
        const token = Math.floor(1000 + Math.random() * 9000).toString();
        let sucesso = false;

        if (moradorSel) {
            sucesso = await registrarEncomenda(moradorSel, origem, token, fotoFile, destinatarioFinal);
        } else {
            sucesso = await registrarEncomendaAvulsa(novoAp, novoBloco, origem, token, fotoFile, destinatarioFinal);
        }

        if (sucesso) {
            // Em vez de só alertar, salvar os dados temporariamente para exibir a tela de confirmação/geração de PDF
            setReciboGerado({
                token,
                origem,
                nome_responsavel: destinatarioFinal,
                apartamento: moradorSel ? moradorSel.apartamento : novoAp,
                bloco: moradorSel ? moradorSel.bloco : novoBloco,
                whatsapp: moradorSel ? moradorSel.whatsapp : "",
                fotoPreview: fotoFile ? URL.createObjectURL(fotoFile) : null
            });

            setMoradorSel(null);
            setDestinatarioFinal('');
            setOrigem('');
            setBusca('');
            setNovoAp('');
            setNovoBloco('');
            setMostrarAvulso(false);
            setFotoFile(null);
            carregarDados();
        } else {
            alert("Erro ao registrar.");
        }
        setLoading(false);
    };

    const handleDownloadPDF = async () => {
        if (!receiptRef.current) return;
        try {
            const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Encomenda_${reciboGerado.apartamento}_${reciboGerado.nome_responsavel}.pdf`);
        } catch (error) {
            console.error("Erro ao gerar PDF", error);
            alert("Não foi possível gerar o PDF.");
        }
    };

    const handleConcluirECompartilhar = async () => {
        if (!receiptRef.current || !reciboGerado) return;

        try {
            const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

            const fileName = `Encomenda_${reciboGerado.apartamento}_${reciboGerado.nome_responsavel.replace(/ /g, '_')}.pdf`;

            const blocoExibicao = reciboGerado.bloco ? reciboGerado.bloco : "Único/Não Informado";
            const local = `Apto: ${reciboGerado.apartamento} - Bloco: ${blocoExibicao}`;
            const text = `*Registro de Encomenda*\nMorador(a): ${reciboGerado.nome_responsavel}\n${local}\n\n_(A foto de confirmação segue em anexo)_`;

            let compartilhadoNativamente = false;

            // Tentativa de compartilhamento direto (Mobile / Browsers compatíveis)
            if (navigator.share) {
                const pdfBlob = pdf.output('blob');
                const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'Comprovante de Encomenda',
                            text: text
                        });
                        compartilhadoNativamente = true;
                    } catch (e) {
                        console.log("Compartilhamento nativo cancelado ou falhou", e);
                    }
                }
            }

            // Fallback para PC ou caso o nativo falhe: Baixa o PDF e abre o link web do WhatsApp
            if (!compartilhadoNativamente) {
                pdf.save(fileName);
                const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                window.open(url, '_blank');
            }

        } catch (error) {
            console.error("Erro ao gerar PDF", error);
            alert("Não foi possível gerar/compartilhar o PDF.");
        }

        // Limpar a tela para registrar nova encomenda imediatamente
        setReciboGerado(null);
        setBusca('');
        setMoradorSel(null);
        setNovoAp('');
        setNovoBloco('');
        setMostrarAvulso(false);
        setDestinatarioFinal('');
        setOrigem('');
        setFotoFile(null);
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

    const handleBaixaPorFotoConfirmar = async (file: File | null) => {
        if (!file) {
            alert("Você precisa tirar a foto para confirmar a entrega!");
            return;
        }
        if (!baixaNomeRecebedor.trim()) {
            alert("Por favor, digite o nome de quem está retirando a encomenda.");
            return;
        }

        setBaixaProcessando(true);

        const idsParaBaixar = baixaLoteIds.length > 0 ? baixaLoteIds : [baixaFotoModalItem.id];
        let sucessoGeral = true;
        let msgErro = "";

        for (const pacoteId of idsParaBaixar) {
            const res = await darBaixaEncomendaPorFoto(
                pacoteId,
                file,
                baixaNomeRecebedor,
                baixaCpfRecebedor,
                baixaFinalizaCadastro,
                baixaFotoModalItem.morador_id
            );
            if (!res.sucesso) {
                sucessoGeral = false;
                msgErro = res.msg;
            }
        }

        setBaixaProcessando(false);

        if (sucessoGeral) {
            alert(idsParaBaixar.length > 1 ? `Entrega de ${idsParaBaixar.length} pacotes confirmada com sucesso!` : "Entrega confirmada por foto com sucesso!");
            setBaixaFotoModalItem(null);
            setBaixaNomeRecebedor('');
            setBaixaCpfRecebedor('');
            setBaixaFinalizaCadastro(false);
            setBaixaLoteIds([]);
            carregarDados();
        } else {
            alert(msgErro || "Erro ao baixar alguns pacotes.");
        }
    };

    const handleOpenBaixaFotoModal = (enc: any) => {
        setBaixaFotoModalItem(enc);
        // Find all packages for the same apartment and block
        const pacotesDoMesmoApto = encomendasPendentes.filter(
            (item: any) => item.apartamento === enc.apartamento && item.bloco === enc.bloco
        );
        // Pre-select all of them for batch baixa
        setBaixaLoteIds(pacotesDoMesmoApto.map((item: any) => item.id));
    };

    const handleToggleBaixaLoteId = (id: string) => {
        setBaixaLoteIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleGerarRelatorioPendentes = () => {
        const data = encomendasPendentes.map(e => ({
            Data: new Date(e.data_chegada).toLocaleDateString(),
            Chegada: new Date(e.data_chegada).toLocaleTimeString(),
            Destinatario: e.destinatario || e.moradores?.nome_responsavel,
            Apartamento: `AP ${e.apartamento} ${e.bloco || ''}`.trim(),
            Origem: e.origem,
            Status: e.status,
            Foto: e.foto_url
        }));
        printHTML(generateReportHTML("Relatório de Encomendas (Na Portaria)", data));
    };

    const handleGerarRelatorioEntregues = async () => {
        const todas = await getTodasEncomendas();
        const entregues = todas.filter((e: any) => e.status === 'Entregue');
        const data = entregues.map((e: any) => ({
            Data: new Date(e.data_chegada).toLocaleDateString(),
            Destinatario: e.destinatario || e.moradores?.nome_responsavel,
            Apartamento: `AP ${e.apartamento} ${e.bloco || ''}`.trim(),
            Origem: e.origem,
            Status: e.status,
            Retirada: e.data_retirada ? new Date(e.data_retirada).toLocaleString() : '-',
            Retirado_Por: e.retirado_por || '-',
            Foto: e.foto_url
        }));
        printHTML(generateReportHTML("Relatório de Encomendas (Entregues)", data));
    };

    const handleWhatsAppRelatorioPendentes = () => {
        const data = encomendasPendentes.map(e => ({
            Data: new Date(e.data_chegada).toLocaleDateString(),
            Chegada: new Date(e.data_chegada).toLocaleTimeString(),
            Destinatario: e.destinatario || e.moradores?.nome_responsavel,
            Apartamento: `AP ${e.apartamento} ${e.bloco || ''}`.trim(),
            Origem: e.origem,
            Status: e.status,
            Foto: e.foto_url
        }));
        shareReportViaWhatsApp("Relatório de Encomendas (Na Portaria)", data);
    };

    const handleWhatsAppRelatorioEntregues = async () => {
        const todas = await getTodasEncomendas();
        const entregues = todas.filter((e: any) => e.status === 'Entregue');
        const data = entregues.map((e: any) => ({
            Data: new Date(e.data_chegada).toLocaleDateString(),
            Destinatario: e.destinatario || e.moradores?.nome_responsavel,
            Apartamento: `AP ${e.apartamento} ${e.bloco || ''}`.trim(),
            Origem: e.origem,
            Status: e.status,
            Retirada: e.data_retirada ? new Date(e.data_retirada).toLocaleString() : '-',
            Retirado_Por: e.retirado_por || '-',
            Foto: e.foto_url
        }));
        shareReportViaWhatsApp("Relatório de Encomendas (Entregues)", data);
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
                            <div className="absolute z-10 w-full bg-white border mt-1 rounded shadow-lg max-h-56 overflow-y-auto">
                                {moradores
                                    .filter(m => String(m.nome_responsavel || "").toLowerCase().includes(busca.toLowerCase()) || String(m.apartamento).includes(busca))
                                    .slice(0, 5)
                                    .map(m => (
                                        <div
                                            key={m.id}
                                            className="p-2 hover:bg-gray-100 cursor-pointer text-black border-b"
                                            onClick={() => { setMoradorSel(m); setDestinatarioFinal(m.nome_responsavel); setBusca(m.nome_responsavel); setMostrarAvulso(false); }}
                                        >
                                            <strong>{m.nome_responsavel}</strong>
                                            <div className="text-xs text-gray-500">AP: {m.apartamento} {m.bloco}</div>
                                        </div>
                                    ))}
                                <div
                                    className="p-3 hover:bg-blue-100 cursor-pointer text-blue-700 text-sm font-bold text-center bg-blue-50"
                                    onClick={() => { setMostrarAvulso(true); setBusca(''); }}
                                >
                                    + Registrar Unidade/Morador Avulso
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Avulso Inputs */}
                    {mostrarAvulso && !moradorSel && (
                        <div className="bg-navy p-4 rounded border border-blue-500/50 mt-2 space-y-3 shadow-inner">
                            <p className="text-sm border-b pb-1 text-blue-400 font-bold border-blue-900 mb-2">Registro Avulso (Morador Não Cadastrado)</p>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-gray-400">Apartamento *</label>
                                    <Input placeholder="Ex: 101" value={novoAp} onChange={(e) => setNovoAp(e.target.value)} className="bg-navy-light text-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400">Bloco (Opcional)</label>
                                    <Input placeholder="Ex: A" value={novoBloco} onChange={(e) => setNovoBloco(e.target.value)} className="bg-navy-light text-white" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">Nome do Destinatário *</label>
                                <Input placeholder="Nome na Etiqueta" value={destinatarioFinal} onChange={(e) => setDestinatarioFinal(e.target.value)} className="bg-navy-light text-white" />
                            </div>
                            <Button size="sm" variant="ghost" className="w-full text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => setMostrarAvulso(false)}>Cancelar Avulso</Button>
                        </div>
                    )}

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

                    {!reciboGerado && (
                        <Button
                            className="w-full bg-success text-white font-bold h-12"
                            onClick={handleRegistrar}
                            disabled={loading}
                        >
                            <Send className="mr-2" size={18} />
                            {loading ? "ENVIANDO..." : "REGISTRAR ENCOMENDA"}
                        </Button>
                    )}

                    {/* SUCCESS VIEW (PDF / WHATSAPP ACTIONS) */}
                    {reciboGerado && (
                        <div className="mt-4 p-4 bg-green-900/40 border border-green-500 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center text-green-400 font-bold mb-3">
                                <Check className="mr-2" size={24} /> Encomenda Registrada com Sucesso!
                            </div>
                            <p className="text-sm text-gray-300 mb-4">
                                Você já pode gerar o comprovante, enviar pelo WhatsApp e realizar um novo registro tudo em um clique!
                            </p>
                            <div className="flex flex-col gap-3">
                                <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-12 font-bold shadow-lg" onClick={handleConcluirECompartilhar}>
                                    <Send className="mr-2" size={18} /> GERAR PDF E ABRIR WHATSAPP
                                </Button>
                                <Button variant="ghost" className="w-full text-gray-400 mt-2" onClick={() => setReciboGerado(null)}>
                                    Realizar Novo Registro
                                </Button>
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>

            {/* LISTA PENDENTES */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <h2 className="text-xl font-bold text-white">Na Portaria ({encomendasPendentes.length})</h2>
                    <div className="flex gap-2 flex-wrap items-center">
                        <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="border-gold text-gold hover:bg-gold hover:text-navy font-bold rounded-r-none" onClick={handleGerarRelatorioPendentes}>
                                <FileText size={16} className="md:mr-1" /> <span className="hidden md:inline">PDF Pendentes</span>
                            </Button>
                            <Button size="sm" className="bg-green-600 text-white hover:bg-green-700 font-bold rounded-l-none" onClick={handleWhatsAppRelatorioPendentes} title="Enviar Pendentes WhatsApp">
                                <MessageCircle size={16} />
                            </Button>
                        </div>
                        <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white font-bold rounded-r-none" onClick={handleGerarRelatorioEntregues}>
                                <Check size={16} className="md:mr-1" /> <span className="hidden md:inline">PDF Entregues</span>
                            </Button>
                            <Button size="sm" className="bg-green-600 text-white hover:bg-green-700 font-bold rounded-l-none" onClick={handleWhatsAppRelatorioEntregues} title="Enviar Entregues WhatsApp">
                                <MessageCircle size={16} />
                            </Button>
                        </div>
                        <Input placeholder="Filtro AP" className="w-24 bg-navy-light border-gray-600 text-white h-9 text-sm" value={filtroAp} onChange={e => setFiltroAp(e.target.value)} />
                        <Input placeholder="Filtro Bloco" className="w-28 bg-navy-light border-gray-600 text-white h-9 text-sm" value={filtroBloco} onChange={e => setFiltroBloco(e.target.value)} />
                    </div>
                </div>

                {encomendasPendentes
                    .filter(enc => (!filtroAp || String(enc.apartamento) === filtroAp) && (!filtroBloco || String(enc.bloco).toLowerCase() === filtroBloco.toLowerCase()))
                    .length === 0 && <p className="text-gray-500">Nenhuma encomenda encontrada para os filtros aplicados.</p>}

                <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-2">
                    {encomendasPendentes
                        .filter(enc => (!filtroAp || String(enc.apartamento) === filtroAp) && (!filtroBloco || String(enc.bloco).toLowerCase() === filtroBloco.toLowerCase()))
                        .map(enc => (
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
                                        <p className="text-sm text-gray-600 truncate">Origem: {enc.origem} • AP {enc.apartamento}{enc.bloco ? ` • BLC ${enc.bloco}` : ''}</p>
                                        {enc.destinatario && <p className="text-xs text-blue-600 font-bold">Para: {enc.destinatario}</p>}
                                        <p className="text-xs text-gray-400">{new Date(enc.data_chegada).toLocaleString()}</p>
                                    </div>
                                </CardContent>
                                {/* Actions outside onClick to avoid triggering modal */}
                                <div className="flex flex-col gap-2 p-2 pt-0 z-10 w-full sm:w-auto">
                                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 font-bold w-full" onClick={(e) => { e.stopPropagation(); handleBaixa(enc.id, enc.token); }}>
                                        BAIXA TOKEN/CPF
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 h-8 flex-1 font-bold tracking-tight px-1" onClick={(e) => {
                                            e.stopPropagation();
                                            setBaixaFotoModalItem(enc);
                                            setBaixaNomeRecebedor(enc.destinatario || enc.moradores?.nome_responsavel || '');
                                            setBaixaCpfRecebedor('');
                                            setBaixaFinalizaCadastro(false);

                                            // Auto-detect other packages for the same unit
                                            const pacotesDoMesmoAp = encomendasPendentes.filter(p =>
                                                p.id !== enc.id &&
                                                p.apartamento === enc.apartamento &&
                                                (p.bloco || "").toLowerCase() === (enc.bloco || "").toLowerCase()
                                            );
                                            setBaixaLoteIds([enc.id, ...pacotesDoMesmoAp.map(p => p.id)]);
                                        }}>
                                            <Camera size={14} className="mr-1" /> FOTO
                                        </Button>
                                        {userRole !== 'porteiro' && (
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50 shrink-0" onClick={async (e) => {
                                                e.stopPropagation();
                                                if (confirm("Excluir encomenda?")) {
                                                    await removerEncomenda(enc.id);
                                                    carregarDados();
                                                }
                                            }}>
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                    </div>
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

            {/* Modal para Baixa por Foto */}
            {baixaFotoModalItem && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <Card className="w-full max-w-sm bg-navy border-blue-500 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <CardHeader className="pb-3 border-b border-gray-700">
                            <CardTitle className="text-xl font-bold text-white flex justify-between items-center">
                                Baixa por Foto
                                <Button variant="ghost" size="icon" onClick={() => setBaixaFotoModalItem(null)} className="h-8 w-8 text-gray-400 hover:text-white">
                                    ✕
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="bg-blue-900/20 p-3 rounded text-sm text-blue-200 border border-blue-500/30">
                                <p><strong>Morador:</strong> {baixaFotoModalItem.moradores?.nome_responsavel}</p>
                                <p><strong>Unidade:</strong> AP {baixaFotoModalItem.apartamento}</p>
                            </div>

                            {/* Detecção de Múltiplos Pacotes */}
                            {baixaLoteIds.length > 1 && (
                                <div className="bg-yellow-900/40 border border-yellow-600/50 p-3 rounded">
                                    <h4 className="font-bold text-yellow-500 text-sm mb-2 flex items-center">
                                        <Package className="mr-2" size={16} />
                                        {baixaLoteIds.length} pacotes pendentes para o AP {baixaFotoModalItem.apartamento}
                                    </h4>
                                    <p className="text-xs text-yellow-200/80 mb-3">
                                        Desmarque os pacotes que <strong>não</strong> serão entregues agora:
                                    </p>
                                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                        {encomendasPendentes
                                            .filter(p => p.apartamento === baixaFotoModalItem.apartamento && p.bloco === baixaFotoModalItem.bloco)
                                            .map(p => (
                                                <div key={p.id} className="flex items-center gap-2 text-sm text-white">
                                                    <input
                                                        type="checkbox"
                                                        checked={baixaLoteIds.includes(p.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setBaixaLoteIds([...baixaLoteIds, p.id]);
                                                            else setBaixaLoteIds(baixaLoteIds.filter(id => id !== p.id));
                                                        }}
                                                        className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500 bg-navy"
                                                    />
                                                    <span className="truncate">{p.origem} {p.destinatario ? `(${p.destinatario})` : ''}</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-white">Nome de quem está retirando:</label>
                                <Input
                                    value={baixaNomeRecebedor}
                                    onChange={(e) => setBaixaNomeRecebedor(e.target.value)}
                                    placeholder="Ex: João da Silva (Filho)"
                                    className="bg-navy-light text-white border-gray-600 focus:border-blue-500 rounded"
                                />
                            </div>

                            <div className="space-y-2 mt-3">
                                <label className="text-sm font-semibold text-white">CPF (Opcional):</label>
                                <Input
                                    value={baixaCpfRecebedor}
                                    onChange={(e) => setBaixaCpfRecebedor(e.target.value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'))}
                                    placeholder="000.000.000-00"
                                    maxLength={14}
                                    className="bg-navy-light text-white border-gray-600 focus:border-blue-500 rounded"
                                />
                            </div>

                            {/* Opcional: Efetivar Cadastro Avulso */}
                            {baixaFotoModalItem?.moradores?.nome_responsavel === "Pendente Cadastro" && (
                                <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded flex gap-3 items-start">
                                    <input
                                        type="checkbox"
                                        id="efetivar"
                                        checked={baixaFinalizaCadastro}
                                        onChange={(e) => setBaixaFinalizaCadastro(e.target.checked)}
                                        className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                    />
                                    <label htmlFor="efetivar" className="text-sm text-blue-100 cursor-pointer">
                                        <span className="font-bold block">Efetivar Morador Desta Unidade?</span>
                                        Salvar no sistema o NOME e CPF acima como o responsável definitivo da unidade AP {baixaFotoModalItem.apartamento}.
                                    </label>
                                </div>
                            )}

                            <div className="pt-2">
                                <CameraAutoCapture onCapture={handleBaixaPorFotoConfirmar} accept="image/*" capture="user">
                                    <Button
                                        disabled={baixaProcessando || !baixaNomeRecebedor.trim()}
                                        className={`w-full h-12 text-sm font-bold shadow-lg ${baixaProcessando ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                                    >
                                        {baixaProcessando ? (
                                            "Processando..."
                                        ) : (
                                            <>
                                                <Camera size={20} className="mr-2" /> Capturar Foto e Entregar
                                            </>
                                        )}
                                    </Button>
                                </CameraAutoCapture>
                                <p className="text-xs text-gray-500 text-center mt-3">A foto servirá como comprovante eterno de retirada.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Hidden Receipt Template for PDF generation */}
            <ReceiptTemplate
                ref={receiptRef}
                encomenda={reciboGerado}
                condominioName="Portaria Web"
            />
        </div >
    );
}
