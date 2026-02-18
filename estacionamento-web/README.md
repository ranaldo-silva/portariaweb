# 🏢 Portaria Web - Sistema de Gestão de Condomínio

Sistema web moderno para gestão de portarias, encomendas, visitantes e comunicação com moradores. Desenvolvido com **Next.js 15 (App Router)**, **Supabase** e **Tailwind CSS**.

## 🚀 Tecnologias

-   **Frontend**: React, Next.js 15, TypeScript, Tailwind CSS, Lucide Icons, Shadcn UI.
-   **Backend / Database**: Supabase (PostgreSQL, Auth, Storage, Edge Functions).
-   **Notificações**: Firebase Cloud Messaging (FCM) & PWA.
-   **Hospedagem**: Vercel.

## ✨ Funcionalidades Principais

### 📦 Gestão de Encomendas
-   **Registro Rápido**: Fluxo otimizado para porteiros registrarem pacotes com foto e descrição em segundos (`/encomendas/rapida`).
-   **Identificação Inteligente**: Sistema sugere moradores ao digitar o apartamento.
-   **Atualização Automática**: Se um novo nome retirar a encomenda, ele é automaticamente adicionado à lista de moradores da unidade.
-   **Notificações Push**: Moradores recebem alerta imediato no celular quando uma encomenda chega.
-   **Histórico**: Registro completo de quem retirou, datas e fotos.

### 🔔 Notificações & PWA
-   Suporte a **Progressive Web App (PWA)** instalável no celular.
-   **Push Notifications** em tempo real para:
    -   Chegada de encomendas.
    -   Chegada de visitantes (com foto).
    -   Mensagens da portaria.
-   Suporte a múltiplos dispositivos por morador.

### 💬 Chat em Tempo Real
-   Canal direto entre **Portaria** e **Administração**.
-   Widget flutuante para comunicação rápida sem sair da tela.
-   Histórico de mensagens salvo no banco de dados.

### 👥 Gestão de Moradores
-   Cadastro completo com validação de CPF.
-   **Fluxo de Aprovação**: Novos cadastros caem em uma lista de "Solicitações" para aprovação do admin.
-   Edição de veículos e lista de dependentes.

### 🚗 Veículos e Visitantes
-   Controle de vagas de estacionamento.
-   Registro de visitantes com captura de foto.
-   Agendamento prévio de visitas pelos moradores.

## 🛠️ Instalação e Configuração

### Pré-requisitos
-   Node.js 18+
-   Conta no Supabase
-   Conta no Firebase (para notificações)

### Passo a Passo

1.  **Clone o repositório**:
    ```bash
    git clone https://github.com/seu-usuario/portariaweb.git
    cd portariaweb
    ```

2.  **Instale as dependências**:
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente**:
    Crie um arquivo `.env.local` na raiz com as chaves do Supabase e Firebase:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...
    NEXT_PUBLIC_VAPID_KEY=sua_chave_vapid_publica
    FIREBASE_ADMIN_PRIVATE_KEY="sua_chave_privada_admin"
    FIREBASE_ADMIN_CLIENT_EMAIL=...
    ```

4.  **Rode o servidor de desenvolvimento**:
    ```bash
    npm run dev
    ```
    Acesse http://localhost:3000

## 🗄️ Estrutura do Banco de Dados (Resumo)

-   `encomendas`: Tabela principal de pacotes entregues.
-   `encomendas_incompletas`: Tabela temporária para registro rápido (sem morador identificado).
-   `moradores`: Dados dos residentes (nome, cpf, ap, bloco, token_fcm).
-   `visitas`: Registro de entrada de visitantes.
-   `solicitacoes`: Fila de aprovação para novos cadastros ou alterações de dados.
-   `chat_messages`: Histórico de conversas do chat interno.
