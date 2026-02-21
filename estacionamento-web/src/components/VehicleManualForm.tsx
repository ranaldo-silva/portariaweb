import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, Save, Car } from 'lucide-react';
import { useStorage } from '@/hooks/useStorage';

interface VehicleManualFormProps {
    vagaConfig: string;
    onClose: () => void;
    onSuccess: (data: any) => void;
}

export function VehicleManualForm({ vagaConfig, onClose, onSuccess }: VehicleManualFormProps) {
    const { salvarVeiculo } = useStorage();
    const [loading, setLoading] = useState(false);

    // Ad-hoc vehicle state
    const [formData, setFormData] = useState({
        vaga: vagaConfig || '',
        placa: '',
        modelo: '',
        cor: '',
        proprietario: '',
        apartamento: '',
        bloco: ''
    });

    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'placa' || name === 'bloco' ? value.toUpperCase() : value }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.placa) {
            setError('A placa é obrigatória.');
            return;
        }

        if (!formData.vaga) {
            setError('Selecione a vaga na tela anterior.');
            return;
        }

        setLoading(true);

        const payload = {
            vaga: formData.vaga,
            placa: formData.placa,
            modelo: `${formData.modelo} ${formData.cor}`.trim() || 'Indefinido',
            proprietario: formData.proprietario || 'Não Identificado',
            apartamento: formData.apartamento || 'N/A',
            bloco: formData.bloco || 'N/A'
        };

        const sucesso = await salvarVeiculo(payload);

        setLoading(false);

        if (sucesso) {
            onSuccess(payload);
        } else {
            setError('Falha ao cadastrar veículo na vaga.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <Card className="w-full max-w-lg bg-navy border-gold shadow-2xl overflow-y-auto max-h-[90vh]">
                <CardHeader className="border-b border-gray-700 pb-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl font-bold text-gold flex items-center gap-2">
                            <Car /> Alocar manualmente
                        </CardTitle>
                        <Button variant="ghost" size="icon" onClick={onClose}><X className="text-white" /></Button>
                    </div>
                    <CardDescription className="text-gray-400">
                        Insira os dados do veículo não cadastrado para vinculá-lo à vaga {formData.vaga}.
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                    {error && (
                        <div className="bg-red-900/40 border border-red-500 text-red-400 p-3 rounded text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-300">Placa *</label>
                                <Input
                                    name="placa"
                                    value={formData.placa}
                                    onChange={handleChange}
                                    placeholder="AAA-1234"
                                    className="bg-white text-black font-bold uppercase"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-300">Modelo</label>
                                <Input
                                    name="modelo"
                                    value={formData.modelo}
                                    onChange={handleChange}
                                    placeholder="Ex: Honda Civic"
                                    className="bg-white text-black"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-300">Cor</label>
                                <Input
                                    name="cor"
                                    value={formData.cor}
                                    onChange={handleChange}
                                    placeholder="Ex: Prata"
                                    className="bg-white text-black"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-300">Nome do Proprietário / Responsável</label>
                                <Input
                                    name="proprietario"
                                    value={formData.proprietario}
                                    onChange={handleChange}
                                    placeholder="Nome (Opicional)"
                                    className="bg-white text-black"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-300">Apartamento</label>
                                <Input
                                    name="apartamento"
                                    value={formData.apartamento}
                                    onChange={handleChange}
                                    placeholder="Ex: 101"
                                    type="number"
                                    className="bg-white text-black"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-300">Bloco</label>
                                <Input
                                    name="bloco"
                                    value={formData.bloco}
                                    onChange={handleChange}
                                    placeholder="Ex: A"
                                    className="bg-white text-black uppercase"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700 mt-6">
                            <Button type="button" variant="outline" onClick={onClose} className="border-gray-500 text-gray-300 hover:bg-gray-800">
                                Cancelar
                            </Button>
                            <Button type="submit" className="bg-success hover:bg-green-600 text-white font-bold" disabled={loading}>
                                {loading ? "Salvando..." : <><Save size={18} className="mr-2" /> Salvar Veículo</>}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
