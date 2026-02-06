"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useStorage } from '@/hooks/useStorage';
import { ShieldCheck, User } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { loginAdmin } = useStorage();

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Clear conflicting roles on load
        localStorage.removeItem('userRole');
    }, []);

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
            router.push('/dashboard');
            return;
        }

        // 2. Tenta Login como Porteiro (Hardcoded para MVP)
        if (
            (email.toLowerCase() === 'porteiro' || email.toLowerCase() === 'porteiro@condominio.com') &&
            senha === '123456'
        ) {
            localStorage.setItem('userRole', 'porteiro');
            router.push('/dashboard');
            return;
        }

        setLoading(false);
        setError("Credenciais inválidas.");
    };

    return (
        <div className="min-h-screen bg-navy flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gold mb-2">Portaria Web</h1>
                    <p className="text-gray-400">Sistema Integrado de Portaria</p>
                </div>

                <Card className="bg-navy-light border-gold shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-center text-white flex items-center justify-center gap-2">
                            <ShieldCheck className="text-gold" /> Acesso Administrativo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-300">Email ou Usuário</label>
                            <Input
                                placeholder="admin@condominio.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-white text-black font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-300">Senha</label>
                            <Input
                                type="password"
                                placeholder="••••••"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="bg-white text-black font-medium"
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm text-center font-bold bg-red-100/10 p-2 rounded">{error}</p>}

                        <Button
                            className="w-full bg-gold text-navy-light hover:bg-gold-hover font-bold text-lg h-12"
                            onClick={handleLogin}
                            disabled={loading}
                        >
                            {loading ? "ENTRANDO..." : "ENTRAR"}
                        </Button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-600" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-navy-light px-2 text-gray-400">Ou</span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full border-gold/50 text-gold hover:bg-gold hover:text-navy font-bold flex items-center gap-2 h-12"
                            onClick={() => router.push('/morador/login')}
                        >
                            <User size={20} /> SOU MORADOR
                        </Button>

                        <p className="text-center text-xs text-gray-500 mt-4">
                            Versão 2.1 - Portaria Remota
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
