"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useStorage } from '@/hooks/useStorage';

export default function Login() {
    const router = useRouter();
    const { loginAdmin } = useStorage();

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setError('');
        if (!email || !senha) {
            setError("Preencha todos os campos.");
            return;
        }

        setLoading(true);

        // 1. Tenta Login como Admin (Supabase)
        const isAdmin = await loginAdmin(email, senha);

        if (isAdmin) {
            localStorage.setItem('userRole', 'admin');
            router.push('/');
            return;
        }

        // 2. Tenta Login como Porteiro (Hardcoded para MVP)
        if (
            (email.toLowerCase() === 'porteiro' || email.toLowerCase() === 'porteiro@condominio.com') &&
            senha === '123456'
        ) {
            localStorage.setItem('userRole', 'porteiro');
            router.push('/');
            return;
        }

        setLoading(false);
        setError("Credenciais inválidas.");
    };

    return (
        <div className="min-h-screen bg-navy flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gold mb-2">Estacionamento</h1>
                    <p className="text-gray-400">Sistema Integrado de Portaria</p>
                </div>

                <Card className="bg-navy-light border-gold">
                    <CardHeader>
                        <CardTitle className="text-center text-white">Acesso ao Sistema</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-300">Email ou Usuário</label>
                            <Input
                                placeholder="admin@condominio.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-white text-black"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-300">Senha</label>
                            <Input
                                type="password"
                                placeholder="••••••"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="bg-white text-black"
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}

                        <Button
                            className="w-full bg-gold text-navy-light hover:bg-gold-hover font-bold text-lg"
                            size="lg"
                            onClick={handleLogin}
                            disabled={loading}
                        >
                            {loading ? "ENTRANDO..." : "ENTRAR"}
                        </Button>

                        <p className="text-center text-xs text-gray-500 mt-4">
                            Acesso restrito a funcionários
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
