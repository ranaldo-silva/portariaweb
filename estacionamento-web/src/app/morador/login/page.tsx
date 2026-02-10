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

    // Auth Flow State
    const [step, setStep] = useState<'PHONE' | 'FIRST_ACCESS' | 'PASSWORD'>('PHONE');
    const [tempMorador, setTempMorador] = useState<any>(null);
    const [cpf, setCpf] = useState("");
    const [senha, setSenha] = useState("");
    const [confirmSenha, setConfirmSenha] = useState("");

    const handleCheckPhone = async () => {
        const cleanPhone = whatsapp.replace(/\D/g, "");

        if (!cleanPhone || cleanPhone.length < 10) {
            setError("Por favor, digite um número de WhatsApp válido (DDD + Número).");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const { data: moradores, error: dbError } = await supabase
                .from('moradores')
                .select('*');

            if (dbError) throw dbError;

            const morador = moradores?.find(m => {
                const stored = (m.whatsapp || "").replace(/\D/g, "");
                // Match exact, or with/without 55 prefix, or last 8/9 digits
                if (!stored || stored.length < 8) return false;
                return stored === cleanPhone ||
                    (stored.endsWith(cleanPhone)) ||
                    (cleanPhone.endsWith(stored) && stored.length >= 8);
            });

            if (morador) {
                setTempMorador(morador);
                if (!morador.senha) {
                    setStep('FIRST_ACCESS');
                } else {
                    setStep('PASSWORD');
                }
            } else {
                setError("Número não encontrado no sistema. Verifique se digitou corretamente ou entre em contato com a portaria para atualizar seu cadastro.");
            }
        } catch (err) {
            console.error(err);
            setError("Falha na conexão. Verifique sua internet e tente novamente.");
        } finally {
            setLoading(false);
        }
    };


    const handleFirstAccess = async () => {
        const cleanCpf = cpf.replace(/\D/g, "");

        if (!cleanCpf || cleanCpf.length !== 11) {
            setError("Por favor, digite um CPF válido com 11 dígitos.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // Auto-generate password from first 5 digits of CPF
            const generatedPassword = cleanCpf.substring(0, 5);

            const { error } = await supabase
                .from('moradores')
                .update({
                    cpf: cleanCpf,
                    senha: generatedPassword
                })
                .eq('id', tempMorador.id);

            if (error) throw error;

            loginSuccess({ ...tempMorador, cpf: cleanCpf, senha: generatedPassword });
        } catch (err) {
            console.error(err);
            setError("Ocorreu um erro ao salvar suas informações. Tente novamente em alguns instantes.");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordLogin = async () => {
        if (!senha) {
            setError("Por favor, digite sua senha.");
            return;
        }

        if (senha !== tempMorador.senha) {
            setError("Senha incorreta. A senha inicial são os 5 primeiros números do seu CPF.");
            return;
        }

        loginSuccess(tempMorador);
    };

    const loginSuccess = (moradorData: any) => {
        localStorage.setItem("morador_session_id", moradorData.id);
        localStorage.setItem("morador_session_name", moradorData.nome_responsavel);
        localStorage.setItem("morador_session_dados", JSON.stringify(moradorData));
        router.push("/morador/dashboard");
    };

    const [showCadastro, setShowCadastro] = useState(false);
    const [cadastroData, setCadastroData] = useState({
        nome: '',
        whatsapp: '',
        apartamento: '',
        bloco: '',
        carro: '',
        moto: '',
        dependentes: ''
    });

    const handleCadastro = async () => {
        if (!cadastroData.nome || !cadastroData.whatsapp || !cadastroData.apartamento || !cadastroData.bloco) {
            setError("Preencha os campos obrigatórios (*)");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // 1. Check Duplicate
            const { count, error: countError } = await supabase
                .from('moradores')
                .select('*', { count: 'exact', head: true })
                .eq('apartamento', parseInt(cadastroData.apartamento))
                .eq('bloco', cadastroData.bloco.toUpperCase());

            if (countError) throw countError;

            if (count && count > 0) {
                setError("Este Apartamento/Bloco já possui cadastro ativo. Contate a administração.");
                setLoading(false);
                return;
            }

            // 2. Submit Request
            const { error: reqError } = await supabase.from('solicitacoes').insert([{
                tipo: 'novo_cadastro',
                dados_novos: cadastroData,
                status: 'pendente',
                // morador_id is NULL for new registrations
            }]);

            if (reqError) throw reqError;

            alert("Solicitação enviada! Aguarde a aprovação da administração.");
            setShowCadastro(false);
            setCadastroData({ nome: '', whatsapp: '', apartamento: '', bloco: '', carro: '', moto: '', dependentes: '' });

        } catch (err) {
            console.error(err);
            setError("Erro ao processar cadastro.");
        } finally {
            setLoading(false);
        }
    };

    if (showCadastro) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-400 dark:from-navy dark:to-navy-light p-4">
                <Card className="w-full max-w-md shadow-2xl border-none bg-white/95 dark:bg-navy-light/95 backdrop-blur animate-in fade-in zoom-in">
                    <CardHeader className="text-center pb-2 relative">
                        <Button variant="ghost" className="absolute left-2 top-2" onClick={() => setShowCadastro(false)}>
                            Voltar
                        </Button>
                        <CardTitle className="text-blue-900 dark:text-gold text-2xl font-bold">Novo Cadastro</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 max-h-[80vh] overflow-y-auto">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Nome Completo *</label>
                            <Input value={cadastroData.nome} onChange={e => setCadastroData({ ...cadastroData, nome: e.target.value })} className="bg-white text-black" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">WhatsApp *</label>
                                <Input value={cadastroData.whatsapp} onChange={e => setCadastroData({ ...cadastroData, whatsapp: e.target.value })} className="bg-white text-black" placeholder="(00) 00000-0000" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Dependentes</label>
                                <Input value={cadastroData.dependentes} onChange={e => setCadastroData({ ...cadastroData, dependentes: e.target.value })} className="bg-white text-black" placeholder="Nomes separados por vírgula" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Apartamento *</label>
                                <Input type="number" value={cadastroData.apartamento} onChange={e => setCadastroData({ ...cadastroData, apartamento: e.target.value })} className="bg-white text-black" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Bloco *</label>
                                <Input value={cadastroData.bloco} onChange={e => setCadastroData({ ...cadastroData, bloco: e.target.value })} className="bg-white text-black uppercase placeholder:text-gray-400" placeholder="A" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Carro (Modelo, Placa, Cor)</label>
                            <Input value={cadastroData.carro} onChange={e => setCadastroData({ ...cadastroData, carro: e.target.value })} className="bg-white text-black" placeholder="Ex: Gol, ABC-1234, Prata" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Moto (Modelo, Placa, Cor)</label>
                            <Input value={cadastroData.moto} onChange={e => setCadastroData({ ...cadastroData, moto: e.target.value })} className="bg-white text-black" />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md flex items-center justify-center gap-2 font-medium border border-red-100">
                                <AlertTriangle size={16} /> {error}
                            </div>
                        )}

                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12" onClick={handleCadastro} disabled={loading}>
                            {loading ? "Enviando..." : "Solicitar Cadastro"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

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

                    {step === 'PHONE' && (
                        <div className="space-y-4">
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
                                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-md flex items-center gap-2 font-medium border border-red-100 dark:border-red-900 animate-in fade-in slide-in-from-top-1">
                                    <AlertTriangle size={18} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 dark:bg-gold dark:text-navy dark:hover:bg-gold-hover text-white font-bold text-md shadow-lg shadow-blue-500/30 dark:shadow-none transition-all"
                                onClick={handleCheckPhone}
                                disabled={loading}
                            >
                                {loading ? "Verificando..." : "Continuar"}
                                {!loading && <LogIn className="ml-2 h-5 w-5" />}
                            </Button>
                            <div className="relative flex items-center py-2">
                                <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">OU</span>
                                <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full h-11 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-gold dark:text-gold dark:hover:bg-navy"
                                onClick={() => setShowCadastro(true)}
                            >
                                Criar Cadastro
                            </Button>
                        </div>
                    )}

                    {step === 'FIRST_ACCESS' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-100 dark:border-yellow-800 text-center">
                                <p className="text-sm text-yellow-800 dark:text-yellow-400 font-bold">Primeiro Acesso Identificado!</p>
                                <p className="text-xs text-yellow-700 dark:text-yellow-500">
                                    Confirme seu CPF para liberar o acesso.<br />
                                    <span className="opacity-75">Sua senha será os 5 primeiros dígitos do CPF.</span>
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Informe seu CPF</label>
                                <Input
                                    placeholder="000.000.000-00"
                                    className="h-11 border-blue-200 dark:border-gray-600 bg-white dark:bg-navy text-black dark:text-white"
                                    value={cpf}
                                    onChange={(e) => setCpf(e.target.value)}
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-md flex items-center gap-2 font-medium border border-red-100 dark:border-red-900 animate-in fade-in slide-in-from-top-1">
                                    <AlertTriangle size={18} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button
                                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold"
                                onClick={handleFirstAccess}
                                disabled={loading}
                            >
                                {loading ? "Validando e Acessando..." : "Acessar Sistema"}
                            </Button>
                            <Button variant="ghost" className="w-full text-xs text-gray-500" onClick={() => setStep('PHONE')}>Voltar</Button>
                        </div>
                    )}


                    {step === 'PASSWORD' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <div className="text-center mb-4">
                                <p className="text-sm font-bold text-blue-900 dark:text-white">Olá, {tempMorador?.nome_responsavel?.split(' ')[0]}</p>
                                <p className="text-xs text-gray-500">
                                    Digite sua senha para entrar.<br />
                                    <span className="text-blue-600 dark:text-blue-400 font-medium opacity-90 block mt-1">
                                        (Sua senha são os 5 primeiros dígitos do CPF)
                                    </span>
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Senha</label>
                                <Input
                                    placeholder="******"
                                    type="password"
                                    className="h-11 border-blue-200 dark:border-gray-600 bg-white dark:bg-navy text-black dark:text-white"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                />
                            </div>
                            <Button
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                onClick={handlePasswordLogin}
                                disabled={loading}
                            >
                                {loading ? "Entrando..." : "Acessar"}
                            </Button>
                            <Button variant="ghost" className="w-full text-xs text-gray-500" onClick={() => {
                                setStep('PHONE');
                                setSenha('');
                                setTempMorador(null);
                            }}>Voltar / Trocar Usuário</Button>
                        </div>
                    )}


                    <p className="text-xs text-center text-gray-400 mt-6 leading-relaxed flex flex-col items-center gap-1">
                        <span>Sistema exclusivo para moradores.</span>
                        <span className="flex items-center gap-1">
                            Em caso de dúvidas, contatar o corpo diretivo pelo WhatsApp
                            <a href="https://wa.me/5511912058006" target="_blank" className="ml-1 inline-flex items-center justify-center text-green-500 hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                                </svg>
                            </a>
                        </span>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
