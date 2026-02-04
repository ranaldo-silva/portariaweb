"use client";

import { useState, useEffect } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Save, Trash2, Pencil, Users } from 'lucide-react';

export default function Moradores() {
    const { salvarMoradorBase, getMoradoresBase, removerMoradorBase } = useStorage();

    const [moradores, setMoradores] = useState<any[]>([]);
    const [pesquisa, setPesquisa] = useState('');
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
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
        const dados = await getMoradoresBase();
        setMoradores(dados || []);
    };

    useEffect(() => { carregar(); }, []);

    const handleSalvar = async () => {
        if (!form.nome) { alert("Nome obrigatório"); return; }
        setLoading(true);

        const ok = await salvarMoradorBase(form);
        if (ok) {
            setForm({ id: '', nome: '', ap: '', bloco: '', modelo: '', moto: '', dependentes: '', whatsapp: '', cpf: '' });
            carregar();
            alert("Salvo com sucesso!");
        } else {
            alert("Erro ao salvar.");
        }
        setLoading(false);
    };

    const filtrados = moradores.filter(m =>
        String(m.nome_responsavel || "").toLowerCase().includes(pesquisa.toLowerCase()) ||
        String(m.apartamento || "").includes(pesquisa)
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FORMULÁRIO */}
            <Card className="bg-navy-light border-gold h-fit">
                <CardHeader>
                    <CardTitle className="text-gold flex items-center gap-2"><Users /> {form.id ? 'Editar' : 'Novo'} Morador</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input placeholder="Nome Responsável" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="bg-white text-black" />
                    <Input placeholder="CPF (Apenas números)" value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} className="bg-white text-black" />

                    <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="Carro (Modelo, Placa)" value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} className="bg-white text-black" />
                        <Input placeholder="Moto (Modelo, Placa)" value={form.moto} onChange={e => setForm({ ...form, moto: e.target.value })} className="bg-white text-black" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <Input placeholder="AP" type="number" value={form.ap} onChange={e => setForm({ ...form, ap: e.target.value })} className="bg-white text-black" />
                        <Input placeholder="Bloco" value={form.bloco} onChange={e => setForm({ ...form, bloco: e.target.value.toUpperCase() })} className="bg-white text-black" />
                        <Input placeholder="WhatsApp" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} className="bg-white text-black" />
                    </div>

                    <textarea
                        className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-black min-h-[80px]"
                        placeholder="Dependentes (separados por vírgula)"
                        value={form.dependentes}
                        onChange={e => setForm({ ...form, dependentes: e.target.value })}
                    />

                    <div className="flex gap-2">
                        <Button className="flex-1 bg-gold hover:bg-gold-hover text-navy font-bold" onClick={handleSalvar} disabled={loading}>
                            <Save size={18} className="mr-2" /> {form.id ? 'ATUALIZAR' : 'SALVAR'}
                        </Button>
                        {form.id && (
                            <Button variant="outline" className="text-white border-white hover:bg-white/10" onClick={() => setForm({ id: '', nome: '', ap: '', bloco: '', modelo: '', moto: '', dependentes: '', whatsapp: '', cpf: '' })}>
                                Cancelar
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* LISTA */}
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Pesquisar..."
                        value={pesquisa}
                        onChange={e => setPesquisa(e.target.value)}
                        className="pl-9 bg-navy-light border-gold/30 text-white placeholder:text-gray-400"
                    />
                </div>

                <div className="space-y-3 max-h-[80vh] overflow-y-auto">
                    {filtrados.map(m => (
                        <Card key={m.id} className="bg-navy border border-gray-700">
                            <CardContent className="p-4 flex justify-between items-start">
                                <div>
                                    <h4 className="text-gold font-bold text-lg">{m.nome_responsavel} <span className="text-sm font-normal text-white">({m.apartamento}-{m.bloco})</span></h4>
                                    <div className="text-sm text-gray-400 space-y-1 mt-1">
                                        <p>🚗 {m.carro_detalhes || '---'}</p>
                                        <p>🏍️ {m.moto_detalhes || '---'}</p>
                                        <p>👥 {m.lista_moradores}</p>
                                        <p>📱 {m.whatsapp}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button size="icon" variant="ghost" className="text-gold hover:bg-gold/10" onClick={() => {
                                        setForm({
                                            id: m.id,
                                            nome: m.nome_responsavel,
                                            ap: String(m.apartamento),
                                            bloco: m.bloco,
                                            modelo: m.carro_detalhes,
                                            moto: m.moto_detalhes,
                                            dependentes: m.lista_moradores,
                                            whatsapp: m.whatsapp,
                                            cpf: m.cpf || ''
                                        });
                                    }}>
                                        <Pencil size={18} />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-500/10" onClick={async () => {
                                        if (confirm("Excluir morador?")) {
                                            await removerMoradorBase(m.id);
                                            carregar();
                                        }
                                    }}>
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
