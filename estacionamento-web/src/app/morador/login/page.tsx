"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Phone, LogIn, User as UserIcon, AlertTriangle } from "lucide-react";

export default function LoginMorador() {
    const router = useRouter();
    const [whatsapp, setWhatsapp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async () => {
        if (!whatsapp || whatsapp.length < 8) {
            setError("Digite um número válido.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Clean input: remove non-numeric chars
            const cleanPhone = whatsapp.replace(/\D/g, "");

            // Simple fuzzy match strategy: 
            // We search for residents where the stored whatsapp *contains* this number 
            // OR the stored number (cleaned) equals this number.

            // Fetch all (optimization: could filter in DB but whatsapp formats vary)
            const { data: moradores, error: dbError } = await supabase
                .from('moradores')
                .select('*');

            if (dbError) throw dbError;

            // Find match
            const morador = moradores?.find(m => {
                const stored = (m.whatsapp || "").replace(/\D/g, "");
                return stored.includes(cleanPhone) || cleanPhone.includes(stored);
            });

            if (morador) {
                // Save session (simple localStorage for this POC)
                localStorage.setItem("morador_session_id", morador.id);
                localStorage.setItem("morador_session_name", morador.nome_responsavel);
                localStorage.setItem("morador_session_dados", JSON.stringify(morador));

                router.push("/morador/dashboard");
            } else {
                setError("Número não encontrado. Contate a portaria.");
            }
        } catch (err) {
            console.error(err);
            setError("Erro ao conectar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-400 dark:from-navy dark:to-navy-light p-4">
            <Card className="w-full max-w-sm shadow-2xl border-none bg-white/95 dark:bg-navy-light/95 backdrop-blur">
                <CardHeader className="text-center space-y-2 pb-6 relative">
                    <Button
                        variant="ghost"
                        className="absolute left-2 top-2 p-2 h-auto text-blue-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-navy"
                        onClick={() => router.push("/")}
                    >
                        ← Voltar
                    </Button>
                    <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-navy rounded-full flex items-center justify-center mb-2">
                        <UserIcon className="w-6 h-6 text-blue-600 dark:text-gold" />
                    </div>
                    <CardTitle className="text-blue-900 dark:text-gold text-2xl font-bold">Área do Morador</CardTitle>
                    <CardDescription className="text-blue-600 dark:text-gray-400 font-medium">
                        Acesse para gerenciar suas entregas e veículos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Seu WhatsApp</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 h-5 w-5 text-blue-500 dark:text-gold" />
                            <Input
                                placeholder="(11) 99999-9999"
                                className="pl-10 h-11 border-blue-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 bg-blue-50 dark:bg-navy dark:text-white text-lg placeholder:text-gray-400"
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                type="tel"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md flex items-center justify-center gap-2 font-medium border border-red-100">
                            <AlertTriangle size={16} /> {error}
                        </div>
                    )}

                    <Button
                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 dark:bg-gold dark:text-navy dark:hover:bg-gold-hover text-white font-bold text-md shadow-lg shadow-blue-500/30 dark:shadow-none transition-all"
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        {loading ? "Verificando..." : "Entrar no Sistema"}
                        {!loading && <LogIn className="ml-2 h-5 w-5" />}
                    </Button>

                    <p className="text-xs text-center text-gray-400 mt-6 leading-relaxed">
                        Sistema exclusivo para moradores.<br />
                        Em caso de dúvidas, procure a portaria.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
