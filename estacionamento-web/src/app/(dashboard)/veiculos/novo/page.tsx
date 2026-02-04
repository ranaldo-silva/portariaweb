"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStorage } from '@/hooks/useStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Assuming Textarea component exists or use Input for now
import { ArrowLeft, CheckCircle, AlertTriangle, MessageCircle, Phone } from 'lucide-react';

function NovoVeiculoContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const vagaParam = searchParams.get('vaga');

    const { getMoradoresBase, salvarVeiculo } = useStorage();

    const [form, setForm] = useState({
        placa: '',
        proprietario: '',
        modelo: '',
        apartamento: '',
        bloco: '',
        vaga: vagaParam || '',
        dependentes: '',
        whatsapp: ''
    });

    const [moradores, setMoradores] = useState<any[]>([]);

    useEffect(() => {
        async function load() {
            const m = await getMoradoresBase();
            setMoradores(m || []);
        }
        load();
    }, [getMoradoresBase]);

    const handlePlacaChange = (texto: string) => {
        const placaUpper = texto.toUpperCase();

        let novoForm = {
            ...form,
            placa: placaUpper,
            proprietario: '',
            modelo: '',
            apartamento: '',
            bloco: '',
            dependentes: '',
            whatsapp: ''
        };

        if (placaUpper.length >= 3) {
            const encontrado = moradores.find((m: any) => {
                const pExibicao = String(m.placa_exibicao || "").toUpperCase();
                return pExibicao.includes(placaUpper);
            });

            if (encontrado) {
                novoForm = {
                    ...novoForm,
                    placa: String(encontrado.placa_exibicao || placaUpper),
                    proprietario: String(encontrado.nome_responsavel || ""),
                    modelo: String(encontrado.carro_detalhes || encontrado.moto_detalhes || ""),
                    apartamento: String(encontrado.apartamento || ""),
                    bloco: String(encontrado.bloco || ""),
                    dependentes: String(encontrado.lista_moradores || "Nenhum dependente"),
                    whatsapp: String(encontrado.whatsapp || "")
                };
            }
        }

        setForm(novoForm);
    };

    const confirmarEntrada = async () => {
        if (!form.placa || !form.proprietario) {
            alert("Identifique o veículo pela placa primeiro.");
            return;
        }

        if (!form.vaga) {
            alert("Digite o número da vaga.");
            return;
        }

        const sucesso = await salvarVeiculo(form);
        if (sucesso) router.push('/');
        else alert("Erro ao salvar.");
    };

    const abrirWhatsapp = () => {
        if (!form.whatsapp) return;
        const numero = form.whatsapp.replace(/\D/g, '');
        if (numero) {
            window.open(`https://wa.me/55${numero}`, '_blank');
        } else {
            alert("Número de WhatsApp inválido.");
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="text-gray-400 pl-0 hover:text-white">
                <ArrowLeft size={20} className="mr-2" /> Voltar
            </Button>

            <Card className="bg-navy-light border-gold">
                <CardHeader>
                    <CardTitle className="text-gold text-2xl text-center">Registrar Entrada</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-300">Vaga</label>
                        <Input
                            value={form.vaga}
                            onChange={(e) => setForm({ ...form, vaga: e.target.value })}
                            className="bg-navy border-gold text-white text-lg font-bold text-center"
                            type="number"
                            placeholder="0"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-300">Placa do Veículo</label>
                        <Input
                            value={form.placa}
                            onChange={(e) => handlePlacaChange(e.target.value)}
                            className="bg-white text-black text-xl font-bold uppercase"
                            placeholder="ABC-1234"
                            autoFocus
                        />
                    </div>

                    {form.proprietario ? (
                        <div className="flex items-center gap-2 p-3 bg-green-900/40 border border-green-500 rounded">
                            <CheckCircle className="text-green-500" />
                            <span className="text-green-500 font-bold">Morador Identificado</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/50 rounded">
                            <AlertTriangle className="text-red-500" />
                            <span className="text-red-500 text-sm">Digite a placa para buscar</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Responsável</label>
                        <div className="flex gap-2">
                            <Input value={form.proprietario} readOnly className="bg-navy/50 border-gray-600 text-gray-300 flex-1" />
                            {form.whatsapp && (
                                <Button
                                    onClick={abrirWhatsapp}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3"
                                    title="Chamar no WhatsApp"
                                >
                                    <MessageCircle size={20} />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Dependentes</label>
                        <Input
                            value={form.dependentes}
                            readOnly
                            className="bg-navy/50 border-gray-600 text-gray-300 italic"
                            placeholder="Nenhum dependente registrado"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Veículo</label>
                        <Input value={form.modelo} readOnly className="bg-navy/50 border-gray-600 text-gray-300" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Apartamento</label>
                            <Input value={form.apartamento} readOnly className="bg-navy/50 border-gray-600 text-gray-300" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Bloco</label>
                            <Input value={form.bloco} readOnly className="bg-navy/50 border-gray-600 text-gray-300" />
                        </div>
                    </div>

                    <Button
                        className="w-full bg-success hover:bg-green-600 text-white font-bold h-12 mt-4"
                        onClick={confirmarEntrada}
                        disabled={!form.proprietario}
                    >
                        CONFIRMAR ENTRADA
                    </Button>

                </CardContent>
            </Card>
        </div>
    );
}

export default function NovoVeiculo() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NovoVeiculoContent />
        </Suspense>
    )
}
