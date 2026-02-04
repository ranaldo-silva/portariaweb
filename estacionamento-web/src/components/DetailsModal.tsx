import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface DetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    data: any;
    type?: 'morador' | 'encomenda' | 'visita' | 'prestador' | 'veiculo';
}

export function DetailsModal({ isOpen, onClose, title, data, type = 'morador' }: DetailsModalProps) {
    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <Card className="w-full max-w-md bg-navy border-gold shadow-2xl relative">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute right-2 top-2 text-gray-400 hover:text-white hover:bg-white/10"
                >
                    <X size={20} />
                </Button>

                <CardHeader className="border-b border-gray-700 pb-2">
                    <CardTitle className="text-xl font-bold text-gold">{title}</CardTitle>
                </CardHeader>

                <CardContent className="p-6 space-y-4 text-white">
                    {/* Common Fields */}
                    {data.nome_responsavel && <p><strong className="text-gold">Nome:</strong> {data.nome_responsavel}</p>}
                    {data.nome && <p><strong className="text-gold">Nome:</strong> {data.nome}</p>}

                    {(data.apartamento || data.bloco) && (
                        <p><strong className="text-gold">Unidade:</strong> AP {data.apartamento} - {data.bloco}</p>
                    )}

                    {/* Resident Specific */}
                    {type === 'morador' && (
                        <>
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
                            <p><strong className="text-gold">Origem:</strong> {data.origem}</p>
                            <p><strong className="text-gold">Status:</strong> {data.status}</p>
                            <p><strong className="text-gold">Chegada:</strong> {new Date(data.data_chegada).toLocaleString('pt-BR')}</p>
                            {data.foto_url && (
                                <div className="mt-2">
                                    <strong className="text-gold">Foto:</strong>
                                    <img src={data.foto_url} alt="Encomenda" className="w-full h-48 object-cover rounded mt-1 border border-gray-600" />
                                </div>
                            )}
                        </>
                    )}

                    {/* Visitor/Provider Specific */}
                    {(type === 'visita' || type === 'prestador') && (
                        <>
                            <p><strong className="text-gold">Documento:</strong> {data.documento}</p>
                            {data.tipo_servico && <p><strong className="text-gold">Serviço:</strong> {data.tipo_servico}</p>}
                            <p><strong className="text-gold">Data:</strong> {new Date(data.data_visita || data.data_cadastro).toLocaleString('pt-BR')}</p>
                            {data.foto_url && (
                                <div className="mt-2">
                                    <strong className="text-gold">Foto:</strong>
                                    <img src={data.foto_url} alt="Foto" className="w-full h-48 object-cover rounded mt-1 border border-gray-600" />
                                </div>
                            )}
                        </>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
