import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from 'react';
import { formatarNomeProprio, formatarVeiculoBase } from '@/lib/utils';

// --- TYPES ---
// (We can extract these to a types file later)

export const useStorage = () => {

    // --- HELPERS (Memoized or internal) ---
    // Moved to @/lib/utils

    // Helper to trigger notification
    const notifyUser = async (userId: number, title: string, body: string, data: any = {}) => {
        try {
            await fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, title, body, data })
            });
        } catch (e) {
            console.error("Failed to send notification", e);
        }
    };

    // --- MORADORES ---
    // CACHE LOGIC: 5 minutes validity
    const sincronizarMoradores = useCallback(async (force = false) => {
        try {
            const CACHE_KEY = 'moradores_cache';
            const TIME_KEY = 'moradores_sync_time';
            const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

            const local = localStorage.getItem(CACHE_KEY);
            const lastSync = localStorage.getItem(TIME_KEY);
            const now = Date.now();

            if (!force && local && lastSync && (now - Number(lastSync) < CACHE_DURATION)) {
                return JSON.parse(local);
            }

            const { data, error } = await supabase.from('moradores').select('*').order('apartamento', { ascending: true });
            if (error) throw error;

            if (data) {
                localStorage.setItem(CACHE_KEY, JSON.stringify(data));
                localStorage.setItem(TIME_KEY, String(now));
            }
            return data || [];
        } catch (e) {
            console.error(e);
            return [];
        }
    }, []);

    const getMoradoresBase = useCallback(async () => {
        try {
            const dados = await sincronizarMoradores();
            return dados.map((m: any) => {
                const carro = m.carro_detalhes || "";
                const moto = m.moto_detalhes || "";
                const buscaVeiculos = (carro + " " + moto).toUpperCase();

                return {
                    ...m,
                    placa_exibicao: buscaVeiculos,
                    veiculo_modelo: carro,
                    moto_detalhes: moto,
                    lista_moradores: String(m.lista_moradores || m.lista_morador || m.dependentes || ""),
                    whatsapp: String(m.whatsapp || "")
                };
            });
        } catch (e) { return []; }
    }, [sincronizarMoradores]);

    const salvarMoradorBase = useCallback(async (morador: any) => {
        try {
            const { error } = await supabase.from('moradores').upsert({
                id: morador.id || undefined,
                nome_responsavel: formatarNomeProprio(morador.nome_responsavel || morador.nome),
                apartamento: parseInt(morador.apartamento || morador.ap) || 0,
                bloco: (morador.bloco || "").toUpperCase(),
                carro_detalhes: morador.carro_detalhes ? morador.carro_detalhes.toUpperCase() : formatarVeiculoBase(morador.modelo),
                moto_detalhes: morador.moto_detalhes ? morador.moto_detalhes.toUpperCase() : formatarVeiculoBase(morador.moto),
                lista_moradores: formatarNomeProprio(morador.lista_moradores || morador.dependentes),
                whatsapp: (morador.whatsapp || "").replace(/\D/g, ""),
                cpf: (morador.cpf || "").replace(/\D/g, ""),
            });
            if (error) throw error;
            await sincronizarMoradores(true);
            return true;
        } catch (e) { return false; }
    }, [sincronizarMoradores]);

    // --- VEÍCULOS E VAGAS ---
    const getVeiculos = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('vagas_ocupadas').select('*');
            if (error) throw error;
            return data?.map(v => ({
                id: v.id,
                vaga: v.numero_vaga,
                veiculo_nome: v.placa?.split('|')[0]?.trim() || "-",
                placa: v.placa?.split('|')[1]?.trim() || v.placa,
                proprietario: v.morador_nome,
                apartamento: v.apartamento,
                bloco: v.bloco,
                dataEntrada: v.data_entrada
            })) || [];
        } catch (e) { return []; }
    }, []);

    const salvarVeiculo = useCallback(async (v: any) => {
        try {
            const identificacaoComp = `${formatarNomeProprio(v.modelo)} | ${(v.placa || "").toUpperCase()}`;
            const { error } = await supabase.from('vagas_ocupadas').insert([{
                numero_vaga: parseInt(v.vaga),
                placa: identificacaoComp,
                morador_nome: formatarNomeProprio(v.proprietario),
                apartamento: v.apartamento,
                bloco: (v.bloco || "").toUpperCase(),
                data_entrada: new Date().toISOString()
            }]);
            return !error;
        } catch { return false; }
    }, []);

    const removerVeiculo = useCallback(async (veiculo: any) => {
        try {
            const { error: insertError } = await supabase.from('historico_vagas').insert([{
                placa: `${veiculo.veiculo_nome} | ${veiculo.placa}`,
                morador_nome: veiculo.proprietario,
                apartamento: veiculo.apartamento,
                bloco: veiculo.bloco,
                numero_vaga: veiculo.vaga,
                data_entrada: veiculo.dataEntrada,
                data_saida: new Date().toISOString()
            }]);

            if (insertError) {
                console.error("Erro ao salvar histórico:", insertError);
                return false;
            }

            const { error: deleteError } = await supabase.from('vagas_ocupadas').delete().eq('id', veiculo.id);
            return !deleteError;
        } catch (e) {
            console.error(e);
            return false;
        }
    }, []);

    const getHistorico = useCallback(async () => {
        try {
            const { data, error } = await supabase.from('historico_vagas').select('*').order('data_saida', { ascending: false });
            if (error) throw error;
            return data?.map(h => ({
                vaga: h.numero_vaga,
                veiculo: h.placa?.split('|')[0]?.trim() || "-",
                placa: h.placa?.split('|')[1]?.trim() || h.placa,
                proprietario: h.morador_nome,
                apartamento: h.apartamento,
                bloco: h.bloco,
                dataEntrada: h.data_entrada,
                dataSaida: h.data_saida
            })) || [];
        } catch (e) { return []; }
    }, []);

    const limparHistorico = useCallback(async () => {
        try {
            const { error } = await supabase.from('historico_vagas').delete().gt('data_saida', '1970-01-01T00:00:00Z');
            return { success: !error, error: error?.message };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }, []);

    const limparAtivos = useCallback(async () => {
        try {
            const { error } = await supabase.from('vagas_ocupadas').delete().gt('data_entrada', '1970-01-01T00:00:00Z');
            return { success: !error, error: error?.message };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }, []);

    // --- ENCOMENDAS ---
    const startUpload = async (file: File | null, bucket: string) => {
        if (!file) return "";
        try {
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, { contentType: file.type, upsert: true });

            if (error) return "";

            const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
            return urlData.publicUrl;
        } catch (e) {
            return "";
        }
    };

    const registrarEncomenda = useCallback(async (morador: any, origem: string, token: string, file: File | null, destinatario: string) => {
        try {
            let urlPublica = "";
            if (file) {
                urlPublica = await startUpload(file, 'encomendas');
            }

            const { error } = await supabase.from('encomendas').insert([{
                morador_id: morador.id,
                apartamento: morador.apartamento,
                bloco: morador.bloco,
                origem: origem,
                token: token,
                foto_url: urlPublica || "",
                status: 'Pendente',
                data_chegada: new Date().toISOString(),
                destinatario: destinatario // Save recipient name
            }]);

            if (!error) {
                // Determine resident ID to notify (assuming morador object has id)
                const moradorId = morador.id;
                notifyUser(
                    moradorId,
                    "📦 Nova Encomenda Chegou!",
                    `Sua encomenda de ${origem} está na portaria. Token: ${token}`,
                    { type: 'encomenda', token }
                );
            }

            return !error;
        } catch (e) {
            return false;
        }
    }, []);

    const getEncomendasAtivas = useCallback(async () => {
        try {
            const { data } = await supabase
                .from('encomendas')
                .select(`*, moradores(nome_responsavel)`)
                .eq('status', 'Pendente')
                .order('data_chegada', { ascending: false });
            return data || [];
        } catch { return []; }
    }, []);

    const getTodasEncomendas = useCallback(async () => {
        try {
            const { data } = await supabase
                .from('encomendas')
                .select(`*, moradores(nome_responsavel)`)
                .order('data_chegada', { ascending: false });
            return data || [];
        } catch { return []; }
    }, []);

    const validarTokenRetirada = useCallback(async (tokenId: string, input: string) => {
        try {
            const { data: enc, error } = await supabase
                .from('encomendas')
                .select('*, moradores(cpf)')
                .eq('id', tokenId)
                .single();

            if (error || !enc) return { sucesso: false, msg: "Encomenda não encontrada!" };

            let autorizado = false;
            let metodoRetirada = "Token";
            const inputClean = input.trim().replace(/\D/g, '');

            if (enc.token === input.trim()) {
                autorizado = true;
                metodoRetirada = "Token";
            }
            else if (enc.moradores && enc.moradores.cpf) {
                const cpfMorador = enc.moradores.cpf.replace(/\D/g, '');
                if (inputClean.length > 0 && inputClean === cpfMorador) {
                    autorizado = true;
                    metodoRetirada = `CPF: ${inputClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}`;
                }
            }
            else if (inputClean.length === 11) {
                autorizado = true;
                metodoRetirada = `CPF: ${inputClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}`;
            }

            if (!autorizado) return { sucesso: false, msg: "Token incorreto ou CPF inválido!" };

            const { error: updateError } = await supabase
                .from('encomendas').update({
                    status: 'Retirado',
                    data_retirada: new Date().toISOString(),
                    retirado_por: metodoRetirada
                }).eq('id', tokenId);
            return { sucesso: !updateError, msg: updateError ? "Erro no servidor" : "Retirada confirmada!" };
        } catch { return { sucesso: false, msg: "Erro de conexão" }; }
    }, []);


    const atualizarEncomenda = useCallback(async (id: string, dados: any) => {
        try {
            const { error } = await supabase.from('encomendas').update({
                origem: dados.origem,
                destinatario: dados.destinatario,
                status: dados.status,
                retirado_por: dados.retirado_por
            }).eq('id', id);
            return !error;
        } catch { return false; }
    }, []);

    const removerEncomenda = useCallback(async (id: string) => {
        try {
            const { error } = await supabase.from('encomendas').delete().eq('id', id);
            return !error;
        } catch { return false; }
    }, []);

    // --- PRESTADORES ---
    const salvarPrestador = useCallback(async (dados: any) => {
        try {
            const fotoUrl = dados.fotoFile ? await startUpload(dados.fotoFile, 'prestadores') : "";
            const docUrl = dados.docFile ? await startUpload(dados.docFile, 'prestadores') : "";

            const { error } = await supabase.from('prestadores').insert([{
                nome: formatarNomeProprio(dados.nome),
                tipo_servico: dados.tipo,
                telefone: (dados.telefone || "").replace(/\D/g, ""),
                documento: dados.documento,
                foto_url: fotoUrl,
                documento_url: docUrl,
                data_cadastro: new Date().toISOString()
            }]);

            if (error) {
                console.error(error);
                return false;
            }
            return true;
        } catch (e) { return false; }
    }, []);

    const getPrestadores = useCallback(async () => {
        try {
            const { data } = await supabase.from('prestadores').select('*').order('data_cadastro', { ascending: false });
            return data || [];
        } catch { return []; }
    }, []);

    // --- VISITAS ---
    const registrarVisita = useCallback(async (dados: any) => {
        try {
            const fotoUrl = dados.fotoFile ? await startUpload(dados.fotoFile, 'visitas') : "";

            const { error } = await supabase.from('visitas').insert([{
                visitante_nome: formatarNomeProprio(dados.nome),
                documento: dados.documento,
                data_visita: dados.dataHora,
                apartamento: dados.apartamento,
                bloco: dados.bloco,
                foto_url: fotoUrl,
                observacoes: dados.observacoes
            }]);

            if (!error) {
                // Determine resident ID to notify - simplified lookup
                const { data: morador } = await supabase
                    .from('moradores')
                    .select('id')
                    .eq('apartamento', dados.apartamento)
                    .eq('bloco', dados.bloco)
                    .limit(1)
                    .single();

                if (morador) {
                    notifyUser(
                        morador.id,
                        "👤 Nova Visita",
                        `${formatarNomeProprio(dados.nome)} está na portaria para o AP ${dados.apartamento}`,
                        { type: 'visita', visitante: dados.nome }
                    );
                }
            }

            return !error;
        } catch (e) { return false; }
    }, []);

    const getVisitas = useCallback(async () => {
        try {
            const { data } = await supabase.from('visitas').select('*').order('data_visita', { ascending: false });
            return data || [];
        } catch { return []; }
    }, []);

    // --- PRÉ-AUTORIZAÇÃO / AGENDAMENTO ---
    const agendarVisita = useCallback(async (dados: any) => {
        try {
            const { error } = await supabase.from('pre_autorizacoes').insert([{
                morador_id: dados.morador_id,
                visitante_nome: formatarNomeProprio(dados.nome),
                documento: dados.documento,
                observacoes: dados.observacoes,
                status: 'pendente'
            }]);
            return !error;
        } catch { return false; }
    }, []);

    const getVisitasAgendadas = useCallback(async () => {
        try {
            const { data } = await supabase
                .from('pre_autorizacoes')
                .select(`*, moradores(nome_responsavel, apartamento, bloco)`)
                .eq('status', 'pendente')
                .order('created_at', { ascending: false });
            return data || [];
        } catch { return []; }
    }, []);

    const getHistoricoVisitas = useCallback(async (moradorId: string) => {
        try {
            const { data } = await supabase
                .from('pre_autorizacoes')
                .select('*')
                .eq('morador_id', moradorId)
                .order('created_at', { ascending: false });
            return data || [];
        } catch { return []; }
    }, []);

    const concluirAgendamento = useCallback(async (id: string) => {
        try {
            const { error } = await supabase.from('pre_autorizacoes').update({ status: 'realizada' }).eq('id', id);
            return !error;
        } catch { return false; }
    }, []);

    const cancelarAgendamento = useCallback(async (id: string) => {
        try {
            const { error } = await supabase.from('pre_autorizacoes').update({ status: 'cancelada' }).eq('id', id);
            return !error;
        } catch { return false; }
    }, []);

    // --- ALERTAS ---
    const enviarAlerta = useCallback(async (dados: { tipo: string, titulo: string, descricao: string, autor: string }) => {
        try {
            const { error } = await supabase.from('alertas_comunidade').insert([{
                tipo: dados.tipo,
                titulo: dados.titulo,
                descricao: dados.descricao,
                data_hora: new Date().toISOString(),
                autor: dados.autor || 'Portaria Principal'
            }]);
            if (!error) {
                // Broadcast to all residents? 
                // Currently API only supports single userId. 
                // We would need a topic subscription or iterate.
                // For this MVP, we might skip or implement a loop if needed.
                // Let's implement a topic 'all_residents' in the future.
            }
            return !error;
        } catch { return false; }
    }, []);

    const getAlertas = useCallback(async () => {
        try {
            const ontem = new Date();
            ontem.setDate(ontem.getDate() - 1);

            const { data, error } = await supabase
                .from('alertas_comunidade')
                .select('*')
                .gte('data_hora', ontem.toISOString())
                .order('data_hora', { ascending: false });

            if (error) return [];
            return data;
        } catch { return []; }
    }, []);

    const removerAlerta = useCallback(async (id: string) => {
        try {
            const { error } = await supabase.from('alertas_comunidade').delete().eq('id', id);
            return !error;
        } catch { return false; }
    }, []);

    const editarAlerta = useCallback(async (id: string, novoTitulo: string, novaDescricao: string) => {
        try {
            const { error } = await supabase.from('alertas_comunidade').update({
                titulo: novoTitulo,
                descricao: novaDescricao
            }).eq('id', id);
            return !error;
        } catch { return false; }
    }, []);

    // --- PLANTAO ---
    const salvarPlantao = useCallback(async (dados: any) => {
        try {
            const { error } = await supabase.from('livro_plantao').upsert({
                data: dados.data,
                turno: dados.turno,
                porteiro_nome: dados.porteiro_nome,
                porteiro_entrada: dados.porteiro_entrada,
                porteiro_saida: dados.porteiro_saida,
                ocorrencias: dados.ocorrencias,
                colaboradores: dados.colaboradores // JSONB array
            }, { onConflict: 'data, turno' });
            return !error;
        } catch { return false; }
    }, []);

    const getPlantao = useCallback(async (data: string, turno: string) => {
        try {
            const { data: res } = await supabase
                .from('livro_plantao')
                .select('*')
                .eq('data', data)
                .eq('turno', turno)
                .single();
            return res || null;
        } catch { return null; }
    }, []);

    const getHistoricoPlantoes = useCallback(async () => {
        try {
            const { data } = await supabase
                .from('livro_plantao')
                .select('data, turno, porteiro_nome')
                .order('data', { ascending: false })
                .limit(30);
            return data || [];
        } catch { return []; }
    }, []);

    // --- AUTH ---
    const loginAdmin = useCallback(async (email: string, senha: string) => {
        try {
            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .eq('email', email.trim())
                .eq('senha', senha.trim())
                .single();

            if (error || !data) return false;
            return true;
        } catch { return false; }
    }, []);

    const cadastroAdmin = useCallback(async (email: string, senha: string) => {
        try {
            const { error } = await supabase.from('admins').insert([{ email: email.trim(), senha: senha.trim() }]);
            return !error;
        } catch { return false; }
    }, []);

    const removerMoradorBase = useCallback(async (id: string) => {
        try {
            const { error } = await supabase.from('moradores').delete().eq('id', id);
            if (!error) await sincronizarMoradores(true);
            return !error;
        } catch { return false; }
    }, [sincronizarMoradores]);

    const removerPrestador = useCallback(async (id: string) => {
        try {
            const { error } = await supabase.from('prestadores').delete().eq('id', id);
            return !error;
        } catch { return false; }
    }, []);

    const removerVisita = useCallback(async (id: string) => {
        try {
            const { error } = await supabase.from('visitas').delete().eq('id', id);
            return !error;
        } catch { return false; }
    }, []);

    return {
        sincronizarMoradores, salvarMoradorBase, getMoradoresBase,
        getVeiculos, salvarVeiculo, removerVeiculo, getHistorico, limparHistorico, limparAtivos,
        registrarEncomenda, getEncomendasAtivas, getTodasEncomendas, validarTokenRetirada, removerEncomenda,
        salvarPrestador, registrarVisita, getPrestadores, getVisitas,
        enviarAlerta, getAlertas, removerAlerta, editarAlerta,
        salvarPlantao, getPlantao, getHistoricoPlantoes,
        loginAdmin, cadastroAdmin, removerMoradorBase,
        removerPrestador, removerVisita, atualizarEncomenda,
        agendarVisita, getVisitasAgendadas, concluirAgendamento, cancelarAgendamento,
        getHistoricoVisitas
    };
};

