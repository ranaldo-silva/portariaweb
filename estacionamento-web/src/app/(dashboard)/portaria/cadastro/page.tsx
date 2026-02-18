"use client";

import { useState } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Save, UserPlus, FileText } from 'lucide-react';

export default function PortariaCadastro() {
    const { getMoradoresBase, solicitarAlteracao, solicitarNovoCadastro } = useStorage();

    const [step, setStep] = useState<'SEARCH' | 'FOUND' | 'NEW'>('SEARCH');
    const [loading, setLoading] = useState(false);

    // Search State
    const [searchAp, setSearchAp] = useState('');
    const [searchBloco, setSearchBloco] = useState('');

    // Form State
    const [formData, setFormData] = useState<any>({});
    const [originalData, setOriginalData] = useState<any>(null);

    const handleSearch = async () => {
        if (!searchAp || !searchBloco) {
            alert("Preencha Apartamento e Bloco");
            return;
        }
        setLoading(true);
        const moradores = await getMoradoresBase();
        const found = moradores.find((m: any) =>
            String(m.apartamento) === searchAp &&
            m.bloco.toUpperCase() === searchBloco.toUpperCase()
        );

        if (found) {
            setOriginalData(found);
            setFormData({
                carro: found.carro_detalhes || '',
                moto: found.moto_detalhes || '',
                dependentes: found.lista_moradores || ''
            });
            setStep('FOUND');
        } else {
            setFormData({
                nome: '',
                whatsapp: '',
                cpf: '',
                carro: '',
                moto: '',
                dependentes: '',
                apartamento: searchAp,
                bloco: searchBloco.toUpperCase()
            });
            setStep('NEW');
        }
        setLoading(false);
    };

    const handleSubmitUpdate = async () => {
        setLoading(true);
        const success = await solicitarAlteracao(originalData.id, formData);
        if (success) {
            alert("Solicitação de atualização enviada para a administração!");
            setStep('SEARCH');
            setSearchAp('');
            setSearchBloco('');
        } else {
            alert("Erro ao enviar solicitação.");
        }
        setLoading(false);
    };

    const handleSubmitNew = async () => {
        if (!formData.nome || !formData.whatsapp) {
            alert("Nome e WhatsApp são obrigatórios");
            return;
        }
        setLoading(true);
        const success = await solicitarNovoCadastro(formData);
        if (success) {
            alert("Solicitação de cadastro enviada para a administração!");
            setStep('SEARCH');
            setSearchAp('');
            setSearchBloco('');
        } else {
            alert("Erro ao enviar solicitação.");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gold flex items-center gap-2">
                <UserPlus className="text-gold" /> Gestão de Unidades
            </h1>

            {step === 'SEARCH' && (
                <Card className="bg-navy-light border-gold/30">
                    <CardHeader>
                        <CardTitle className="text-white">Buscar Unidade</CardTitle>
                        <CardDescription>Digite o Apartamento e Bloco para verificar o cadastro.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <Input
                            placeholder="Apartamento (Ex: 101)"
                            type="number"
                            value={searchAp}
                            onChange={e => setSearchAp(e.target.value)}
                            className="bg-white text-black"
                        />
                        <Input
                            placeholder="Bloco (Ex: A)"
                            value={searchBloco}
                            onChange={e => setSearchBloco(e.target.value.toUpperCase())}
                            className="bg-white text-black uppercase"
                        />
                        <Button className="bg-gold text-navy font-bold hover:bg-gold-hover" onClick={handleSearch} disabled={loading}>
                            <Search className="mr-2 h-4 w-4" /> {loading ? "Verificando..." : "Verificar"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {step === 'FOUND' && originalData && (
                <Card className="bg-navy-light border-green-500/50">
                    <CardHeader className="bg-green-900/20 border-b border-green-500/20">
                        <CardTitle className="text-green-400 flex items-center gap-2">
                            <FileText size={18} /> Cadastro Encontrado
                        </CardTitle>
                        <CardDescription className="text-gray-300">
                            Unidade <strong>{searchAp}-{searchBloco}</strong>. Atualize os dados abaixo se necessário.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">Responsável (Somente Leitura)</label>
                                <Input value={originalData.nome_responsavel} disabled className="bg-gray-700 text-gray-300 border-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-400">WhatsApp (Somente Leitura)</label>
                                <Input value={originalData.whatsapp} disabled className="bg-gray-700 text-gray-300 border-none" />
                            </div>
                        </div>

                        <div className="border-t border-gray-700 my-4" />

                        <div className="space-y-4">
                            <h3 className="text-gold font-bold text-sm">Dados Editáveis</h3>

                            <Input
                                placeholder="Carro (Modelo, Placa, Cor)"
                                value={formData.carro}
                                onChange={e => setFormData({ ...formData, carro: e.target.value })}
                                className="bg-white text-black"
                            />
                            <Input
                                placeholder="Moto (Modelo, Placa, Cor)"
                                value={formData.moto}
                                onChange={e => setFormData({ ...formData, moto: e.target.value })}
                                className="bg-white text-black"
                            />
                            <textarea
                                className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-black min-h-[80px]"
                                placeholder="Dependentes (separados por vírgula)"
                                value={formData.dependentes}
                                onChange={e => setFormData({ ...formData, dependentes: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => { setStep('SEARCH'); setSearchAp(''); setSearchBloco(''); }} className="border-gray-500 text-gray-400 hover:bg-gray-800">
                                Cancelar
                            </Button>
                            <Button className="bg-green-600 hover:bg-green-700 text-white font-bold" onClick={handleSubmitUpdate} disabled={loading}>
                                <Save className="mr-2 h-4 w-4" /> {loading ? "Enviando..." : "Solicitar Atualização"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 'NEW' && (
                <Card className="bg-navy-light border-blue-500/50">
                    <CardHeader className="bg-blue-900/20 border-b border-blue-500/20">
                        <CardTitle className="text-blue-400 flex items-center gap-2">
                            <UserPlus size={18} /> Novo Cadastro
                        </CardTitle>
                        <CardDescription className="text-gray-300">
                            Unidade <strong>{searchAp}-{searchBloco}</strong> não encontrada. Preencha para solicitar cadastro.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                placeholder="Nome Responsável *"
                                value={formData.nome}
                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                className="bg-white text-black"
                            />
                            <Input
                                placeholder="CPF"
                                value={formData.cpf}
                                onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                                className="bg-white text-black"
                            />
                            <Input
                                placeholder="WhatsApp *"
                                value={formData.whatsapp}
                                onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                                className="bg-white text-black"
                            />
                        </div>

                        <div className="border-t border-gray-700 my-4" />

                        <div className="space-y-4">
                            <Input
                                placeholder="Carro (Modelo, Placa, Cor)"
                                value={formData.carro}
                                onChange={e => setFormData({ ...formData, carro: e.target.value })}
                                className="bg-white text-black"
                            />
                            <Input
                                placeholder="Moto (Modelo, Placa, Cor)"
                                value={formData.moto}
                                onChange={e => setFormData({ ...formData, moto: e.target.value })}
                                className="bg-white text-black"
                            />
                            <textarea
                                className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-black min-h-[80px]"
                                placeholder="Dependentes (separados por vírgula)"
                                value={formData.dependentes}
                                onChange={e => setFormData({ ...formData, dependentes: e.target.value })}
                            />
                        </div>

                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => { setStep('SEARCH'); setSearchAp(''); setSearchBloco(''); }} className="border-gray-500 text-gray-400 hover:bg-gray-800">
                                Cancelar
                            </Button>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold" onClick={handleSubmitNew} disabled={loading}>
                                <Save className="mr-2 h-4 w-4" /> {loading ? "Enviando..." : "Solicitar Cadastro"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
