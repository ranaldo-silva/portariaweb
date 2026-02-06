import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Edit2, Trash2, Save } from "lucide-react";

interface DetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    data: any;
    type?: 'morador' | 'encomenda' | 'visita' | 'prestador' | 'veiculo';
    onSave?: (updatedData: any) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
}

export function DetailsModal({ isOpen, onClose, title, data, type = 'morador', onSave, onDelete }: DetailsModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (data) {
            setFormData({ ...data });
            setIsEditing(false);
        }
    }, [data, isOpen]);

    if (!isOpen || !data) return null;

    const handleSave = async () => {
        if (!onSave) return;
        setLoading(true);
        await onSave(formData);
        setLoading(false);
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (!onDelete || !confirm("Tem certeza que deseja EXCLUIR este registro? Esta ação não pode ser desfeita.")) return;
        setLoading(true);
        await onDelete(data.id);
        setLoading(false);
        onClose();
    };

    const handleChange = (field: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
            <Card className="w-full max-w-lg bg-navy border-gold shadow-2xl relative my-auto">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute right-2 top-2 text-gray-400 hover:text-white hover:bg-white/10"
                >
                    <X size={20} />
                </Button>

                <CardHeader className="border-b border-gray-700 pb-2 flex flex-row justify-between items-center pr-12">
                    <CardTitle className="text-xl font-bold text-gold">{isEditing ? "Editar Registro" : title}</CardTitle>
                </CardHeader>

                <CardContent className="p-6 space-y-4 text-white">
                    {/* --- READ ONLY MODE --- */}
                    {!isEditing && (
                        <>
                            {data.nome_responsavel && <p><strong className="text-gold">Nome:</strong> {data.nome_responsavel}</p>}
                            {data.nome && <p><strong className="text-gold">Nome:</strong> {data.nome}</p>}

                            {(data.apartamento || data.bloco) && (
                                <p><strong className="text-gold">Unidade:</strong> AP {data.apartamento} - {data.bloco}</p>
                            )}

                            {/* Resident Specific */}
                            {type === 'morador' && (
                                <>
                                    <p><strong className="text-gold">Whatsapp:</strong> {data.whatsapp || "-"}</p>
                                    <p><strong className="text-gold">Carro:</strong> {data.carro_detalhes || "---"}</p>
                                    <p><strong className="text-gold">Moto:</strong> {data.moto_detalhes || "---"}</p>
                                    <div className="bg-navy-light p-2 rounded border border-gray-700">
                                        <strong className="text-gold block mb-1">Dependentes:</strong>
                                        <p className="text-sm text-gray-300 italic">
                                            {data.lista_moradores || data.lista_morador || data.dependentes || "Nenhum registrado"}
                                        </p>
                                    </div>
                                    {data.whatsapp && (
                                        <Button
                                            className="w-full bg-green-600 hover:bg-green-700 mt-2"
                                            onClick={() => window.open(`https://wa.me/55${data.whatsapp.replace(/\D/g, '')}`, '_blank')}
                                        >
                                            Chamar no WhatsApp
                                        </Button>
                                    )}
                                </>
                            )}

                            {/* Package Specific */}
                            {type === 'encomenda' && (
                                <>
                                    <p><strong className="text-gold">Destinatário:</strong> {data.destinatario || "-"}</p>
                                    <p><strong className="text-gold">Origem:</strong> {data.origem}</p>
                                    <p><strong className="text-gold">Status:</strong> {data.status}</p>
                                    <p><strong className="text-gold">Chegada:</strong> {new Date(data.data_chegada).toLocaleString('pt-BR')}</p>
                                    {data.data_retirada && <p><strong className="text-gold">Retirada:</strong> {new Date(data.data_retirada).toLocaleString('pt-BR')}</p>}
                                    {data.retirado_por && <p><strong className="text-gold">Retirado Por:</strong> {data.retirado_por}</p>}
                                    {data.foto_url && (
                                        <div className="mt-2">
                                            <strong className="text-gold">Foto:</strong>
                                            <img src={data.foto_url} alt="Encomenda" className="w-full h-48 object-cover rounded mt-1 border border-gray-600" />
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* --- EDIT MODE --- */}
                    {isEditing && (
                        <div className="space-y-3">
                            {type === 'morador' && (
                                <>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label>Nome Responsável</Label>
                                            <Input value={formData.nome_responsavel || ""} onChange={e => handleChange('nome_responsavel', e.target.value)} className="bg-white text-black" />
                                        </div>
                                        <div>
                                            <Label>WhatsApp</Label>
                                            <Input value={formData.whatsapp || ""} onChange={e => handleChange('whatsapp', e.target.value)} className="bg-white text-black" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label>Apartamento</Label>
                                            <Input value={formData.apartamento || ""} onChange={e => handleChange('apartamento', e.target.value)} className="bg-white text-black" />
                                        </div>
                                        <div>
                                            <Label>Bloco</Label>
                                            <Input value={formData.bloco || ""} onChange={e => handleChange('bloco', e.target.value)} className="bg-white text-black" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Carro (Modelo, Placa, Cor)</Label>
                                        <Input value={formData.carro_detalhes || ""} onChange={e => handleChange('carro_detalhes', e.target.value)} className="bg-white text-black" />
                                    </div>
                                    <div>
                                        <Label>Moto</Label>
                                        <Input value={formData.moto_detalhes || ""} onChange={e => handleChange('moto_detalhes', e.target.value)} className="bg-white text-black" />
                                    </div>
                                    <div>
                                        <Label>Dependentes</Label>
                                        <Textarea value={formData.lista_moradores || ""} onChange={e => handleChange('lista_moradores', e.target.value)} className="bg-white text-black" />
                                    </div>
                                </>
                            )}

                            {type === 'encomenda' && (
                                <>
                                    <div>
                                        <Label>Origem</Label>
                                        <Input value={formData.origem || ""} onChange={e => handleChange('origem', e.target.value)} className="bg-white text-black" />
                                    </div>
                                    <div>
                                        <Label>Destinatário</Label>
                                        <Input value={formData.destinatario || ""} onChange={e => handleChange('destinatario', e.target.value)} className="bg-white text-black" />
                                    </div>
                                    <div>
                                        <Label>Status</Label>
                                        <select
                                            className="w-full p-2 rounded bg-white text-black"
                                            value={formData.status || "Pendente"}
                                            onChange={e => handleChange('status', e.target.value)}
                                        >
                                            <option value="Pendente">Pendente</option>
                                            <option value="Retirado">Retirado</option>
                                        </select>
                                    </div>
                                    {formData.status === 'Retirado' && (
                                        <div>
                                            <Label>Retirado Por</Label>
                                            <Input value={formData.retirado_por || ""} onChange={e => handleChange('retirado_por', e.target.value)} className="bg-white text-black" />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </CardContent>

                <CardFooter className="bg-navy-dark border-t border-gray-700 p-4 flex justify-between">
                    {/* Delete Action (Always Visible if enabled) */}
                    {onDelete ? (
                        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
                            <Trash2 size={16} className="mr-2" /> Excluir
                        </Button>
                    ) : <div></div>}

                    {/* Edit/Save Actions */}
                    {onSave && (
                        <div className="flex gap-2">
                            {isEditing ? (
                                <>
                                    <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={loading} className="text-gray-300">
                                        Cancelar
                                    </Button>
                                    <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave} disabled={loading}>
                                        <Save size={16} className="mr-2" /> Salvar
                                    </Button>
                                </>
                            ) : (
                                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsEditing(true)}>
                                    <Edit2 size={16} className="mr-2" /> Editar
                                </Button>
                            )}
                        </div>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
