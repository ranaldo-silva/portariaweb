"use client";

import { useState } from 'react';
import { useStorage } from '@/hooks/useStorage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserCog, Camera } from 'lucide-react';

export default function Visitas() {
    const { registrarVisita } = useStorage();

    const [nome, setNome] = useState('');
    const [documento, setDocumento] = useState('');
    const [apartamento, setApartamento] = useState('');
    const [bloco, setBloco] = useState('');
    const [fotoFile, setFotoFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    // Note: Date is auto-set to now() on server/hook usually, but hook expects dataHora logic
    // The hook does: data_visita: dados.dataHora
    // I should provide current time.

    const handleSalvar = async () => {
        if (!nome || !apartamento) return alert("Nome e Apartamento obrigatórios");
        setLoading(true);

        const dados = {
            nome,
            documento,
            apartamento,
            bloco,
            dataHora: new Date().toISOString(),
            fotoFile
        };

        const ok = await registrarVisita(dados);
        if (ok) {
            alert("Visita registrada!");
            setNome(''); setDocumento(''); setApartamento(''); setBloco(''); setFotoFile(null);
        } else {
            alert("Erro ao registrar.");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-md mx-auto">
            <Card className="bg-navy-light border-gold">
                <CardHeader>
                    <CardTitle className="text-gold flex items-center gap-2"><UserCog /> Registrar Visita</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input placeholder="Nome Visitante" value={nome} onChange={e => setNome(e.target.value)} className="bg-white text-black" />
                    <Input placeholder="Documento (RG/CPF)" value={documento} onChange={e => setDocumento(e.target.value)} className="bg-white text-black" />

                    <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="AP" type="number" value={apartamento} onChange={e => setApartamento(e.target.value)} className="bg-white text-black" />
                        <Input placeholder="Bloco" value={bloco} onChange={e => setBloco(e.target.value.toUpperCase())} className="bg-white text-black" />
                    </div>

                    <div
                        className="border-2 border-dashed border-gold/50 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-navy/50 transition-colors relative"
                    >
                        <input type="file" accept="image/*" capture="user" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setFotoFile(e.target.files[0])} />
                        <Camera size={32} className="text-gold mb-2" />
                        <p className="text-gray-400 text-sm">{fotoFile ? "Foto Capturada" : "Foto Visitante (Opcional)"}</p>
                    </div>

                    <Button className="w-full bg-success text-white font-bold h-12" onClick={handleSalvar} disabled={loading}>
                        {loading ? "REGISTRANDO..." : "REGISTRAR ENTRADA"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
