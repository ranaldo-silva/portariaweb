import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

// --- TYPES ---
// (We can extract these to a types file later)

export const useStorage = () => {

    // --- MORADORES ---
    const sincronizarMoradores = async (force = false) => {
        try {
            const CACHE_KEY = 'moradores_cache';
            const TIME_KEY = 'moradores_sync_time';
            const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

            const local = localStorage.getItem(CACHE_KEY);
            const lastSync = localStorage.getItem(TIME_KEY);
            const now = Date.now();

            // Return cache if valid and not forced
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
            const local = localStorage.getItem('moradores_cache');
            return local ? JSON.parse(local) : [];
        }
    };

    const getMoradoresBase = async () => {
        try {
            // Always try to sync first on web to get fresh data
            const dados = await sincronizarMoradores();
            return dados.map((m: any) => {
                // Combine car and moto details for robust searching
                const carro = m.carro_detalhes || "";
                const moto = m.moto_detalhes || "";
                const buscaVeiculos = (carro + " " + moto).toUpperCase();

                return {
                    ...m,
                    // Use the combined string for regex/includes search
                    placa_exibicao: buscaVeiculos,
                    veiculo_modelo: carro,
                    moto_detalhes: moto,
                    // Try common variations just in case
                    lista_moradores: String(m.lista_moradores || m.lista_morador || m.dependentes || ""),
                    whatsapp: String(m.whatsapp || "")
                };
            });
        } catch (e) { return []; }
    };

    const formatarNomeProprio = (texto: any) => {
        if (!texto || typeof texto !== 'string') return "";
        const excessoes = ["de", "da", "do", "das", "dos", "e"];
        return texto
            .toLowerCase()
            .split(" ")
            .filter((p: string) => p.length > 0)
            .map((palavra: string, index: number) => {
                if (excessoes.includes(palavra) && index !== 0) return palavra;
                return palavra.charAt(0).toUpperCase() + palavra.slice(1);
            })
            .join(" ");
    };

    const formatarVeiculoBase = (texto: any) => {
        if (!texto || typeof texto !== 'string') return "";
        if (texto.includes(",")) {
            const partes = texto.split(",");
            if (partes.length >= 2) {
                const modelo = formatarNomeProprio(partes[0].trim());
                const placa = (partes[1] || "").trim().toUpperCase();
                const cor = partes[2] ? formatarNomeProprio(partes[2].trim()) : "";
                return cor ? `${modelo}, ${placa}, ${cor}` : `${modelo}, ${placa}`;
            }
        }
        return texto.length <= 8 ? texto.toUpperCase() : formatarNomeProprio(texto);
    };

    const salvarMoradorBase = async (morador: any) => {
        try {
            const { error } = await supabase.from('moradores').upsert({
                id: morador.id || undefined,
                nome_responsavel: formatarNomeProprio(morador.nome),
                apartamento: parseInt(morador.ap) || 0,
                bloco: (morador.bloco || "").toUpperCase(),
                carro_detalhes: formatarVeiculoBase(morador.modelo),
                moto_detalhes: formatarVeiculoBase(morador.moto),
                lista_moradores: formatarNomeProprio(morador.dependentes),
                whatsapp: (morador.whatsapp || "").replace(/\D/g, ""),
                cpf: (morador.cpf || "").replace(/\D/g, ""),
            });
            if (error) throw error;
            await sincronizarMoradores(true);
            return true;
        } catch (e) { return false; }
    };

    // --- VEÍCULOS E VAGAS ---
    const getVeiculos = async () => {
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
    };

    const salvarVeiculo = async (v: any) => {
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
    };

    const removerVeiculo = async (veiculo: any) => {
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
    };

    const getHistorico = async () => {
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
    };

    const limparHistorico = async () => {
        try {
            const { error } = await supabase.from('historico_vagas').delete().gt('data_saida', '1970-01-01T00:00:00Z');
            return { success: !error, error: error?.message };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    };

    const limparAtivos = async () => {
        try {
            const { error } = await supabase.from('vagas_ocupadas').delete().gt('data_entrada', '1970-01-01T00:00:00Z');
            return { success: !error, error: error?.message };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    };

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

    const registrarEncomenda = async (morador: any, origem: string, token: string, file: File | null) => {
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
                data_chegada: new Date().toISOString()
            }]);
            return !error;
        } catch (e) {
            return false;
        }
    };

    const getEncomendasAtivas = async () => {
        try {
            const { data } = await supabase
                .from('encomendas')
                .select(`*, moradores(nome_responsavel)`)
                .eq('status', 'Pendente')
                .order('data_chegada', { ascending: false });
            return data || [];
        } catch { return []; }
    };

    const getTodasEncomendas = async () => {
        try {
            const { data } = await supabase
                .from('encomendas')
                .select(`*, moradores(nome_responsavel)`)
                .order('data_chegada', { ascending: false });
            return data || [];
        } catch { return []; }
    };

    const validarTokenRetirada = async (tokenId: string, input: string) => {
        try {
            const { data: enc, error } = await supabase
                .from('encomendas')
                .select('*, moradores(cpf)')
                .eq('id', tokenId)
                .single();

            if (error || !enc) return { sucesso: false, msg: "Encomenda não encontrada!" };

            let autorizado = false;
            const inputClean = input.trim().replace(/\D/g, '');

            if (enc.token === input.trim()) {
                autorizado = true;
            }
            else if (enc.moradores && enc.moradores.cpf) {
                const cpfMorador = enc.moradores.cpf.replace(/\D/g, '');
                if (inputClean.length > 0 && inputClean === cpfMorador) {
                    autorizado = true;
                }
            }
            else if (inputClean.length === 11) {
                autorizado = true;
            }

            if (!autorizado) return { sucesso: false, msg: "Token incorreto ou CPF inválido!" };

            const { error: updateError } = await supabase
                .from('encomendas').update({ status: 'Retirado', data_retirada: new Date().toISOString() }).eq('id', tokenId);
            return { sucesso: !updateError, msg: updateError ? "Erro no servidor" : "Retirada confirmada!" };
        } catch { return { sucesso: false, msg: "Erro de conexão" }; }
    };

    const removerEncomenda = async (id: string) => {
        try {
            const { error } = await supabase.from('encomendas').delete().eq('id', id);
            return !error;
        } catch { return false; }
    };

    // --- PRESTADORES ---
    const salvarPrestador = async (dados: any) => {
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
    };

    const getPrestadores = async () => {
        try {
            const { data } = await supabase.from('prestadores').select('*').order('data_cadastro', { ascending: false });
            return data || [];
        } catch { return []; }
    };

    // --- VISITAS ---
    const registrarVisita = async (dados: any) => {
        try {
            const fotoUrl = dados.fotoFile ? await startUpload(dados.fotoFile, 'visitas') : "";

            const { error } = await supabase.from('visitas').insert([{
                visitante_nome: formatarNomeProprio(dados.nome),
                documento: dados.documento,
                data_visita: dados.dataHora,
                apartamento: dados.apartamento,
                bloco: dados.bloco,
                foto_url: fotoUrl
            }]);

            return !error;
        } catch (e) { return false; }
    };

    const getVisitas = async () => {
        try {
            const { data } = await supabase.from('visitas').select('*').order('data_visita', { ascending: false });
            return data || [];
        } catch { return []; }
    };

    // --- ALERTAS ---
    const enviarAlerta = async (dados: { tipo: string, titulo: string, descricao: string, autor: string }) => {
        try {
            const { error } = await supabase.from('alertas_comunidade').insert([{
                tipo: dados.tipo,
                titulo: dados.titulo,
                descricao: dados.descricao,
                data_hora: new Date().toISOString(),
                autor: dados.autor || 'Portaria Principal'
            }]);
            return !error;
        } catch { return false; }
    };

    const getAlertas = async () => {
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
    };

    const removerAlerta = async (id: string) => {
        try {
            const { error } = await supabase.from('alertas_comunidade').delete().eq('id', id);
            return !error;
        } catch { return false; }
    };

    const editarAlerta = async (id: string, novoTitulo: string, novaDescricao: string) => {
        try {
            const { error } = await supabase.from('alertas_comunidade').update({
                titulo: novoTitulo,
                descricao: novaDescricao
            }).eq('id', id);
            return !error;
        } catch { return false; }
    };

    // --- PLANTAO ---
    const salvarPlantao = async (dados: any) => {
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
    };

    const getPlantao = async (data: string, turno: string) => {
        try {
            const { data: res } = await supabase
                .from('livro_plantao')
                .select('*')
                .eq('data', data)
                .eq('turno', turno)
                .single();
            return res || null;
        } catch { return null; }
    };

    const getHistoricoPlantoes = async () => {
        try {
            const { data } = await supabase
                .from('livro_plantao')
                .select('data, turno, porteiro_nome')
                .order('data', { ascending: false })
                .limit(30);
            return data || [];
        } catch { return []; }
    };

    // --- AUTH ---
    const loginAdmin = async (email: string, senha: string) => {
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
    };

    const cadastroAdmin = async (email: string, senha: string) => {
        try {
            const { error } = await supabase.from('admins').insert([{ email: email.trim(), senha: senha.trim() }]);
            return !error;
        } catch { return false; }
    };

    const removerMoradorBase = async (id: string) => {
        try {
            const { error } = await supabase.from('moradores').delete().eq('id', id);
            if (!error) await sincronizarMoradores(true);
            return !error;
        } catch { return false; }
    };

    const removerPrestador = async (id: string) => {
        try {
            const { error } = await supabase.from('prestadores').delete().eq('id', id);
            return !error;
        } catch { return false; }
    };

    const removerVisita = async (id: string) => {
        try {
            const { error } = await supabase.from('visitas').delete().eq('id', id);
            return !error;
        } catch { return false; }
    };

    return {
        sincronizarMoradores, salvarMoradorBase, getMoradoresBase,
        getVeiculos, salvarVeiculo, removerVeiculo, getHistorico, limparHistorico, limparAtivos,
        registrarEncomenda, getEncomendasAtivas, getTodasEncomendas, validarTokenRetirada, removerEncomenda,
        salvarPrestador, registrarVisita, getPrestadores, getVisitas,
        enviarAlerta, getAlertas, removerAlerta, editarAlerta,
        salvarPlantao, getPlantao, getHistoricoPlantoes,
        loginAdmin, cadastroAdmin, removerMoradorBase,
        removerPrestador, removerVisita
    };
};
