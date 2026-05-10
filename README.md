# watchparty · nativos.cloud

Plataforma privada de watch-together para a comunidade nativos.cloud.  
Fork de [howardchung/watchparty](https://github.com/howardchung/watchparty) com redesign completo e deploy alvo em OKE (Oracle Kubernetes Engine).

## Funcionalidades

- Sincronização de vídeo em tempo real (play, pause, seek) para todos na sala
- Compartilhamento de tela (aba, janela ou tela inteira)
- Virtual Browser compartilhado (powered by [neko](https://github.com/m1k1o/neko))
- Suporte a YouTube, HTTP, magnet links (WebTorrent) e streams HLS (.m3u8)
- Playlist com avanço automático ao fim de cada vídeo
- Chat estilo terminal com reações, replies e menções
- Video chat (WebRTC)
- Salas permanentes com vanity URL

## Início rápido

```bash
# 1. Dependências
npm install

# 2. Configuração
cp .env.example .env
# edite o .env com as variáveis necessárias

# 3. Dev (dois terminais)
npm run dev   # backend na porta 8080
npm run ui    # frontend Vite na porta 5173
```

Acesse `http://localhost:5173`. Com `VITE_FIREBASE_CONFIG` vazio no `.env`, todas as funcionalidades ficam desbloqueadas sem login.

## Configuração

### YouTube (busca de vídeos)

Necessário para buscar vídeos pelo nome na barra de endereço.

1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Ative a **YouTube Data API v3**
3. Crie uma **API key** em APIs & Services → Credentials
4. Adicione ao `.env`:

```
YOUTUBE_API_KEY=AIza...
```

A quota gratuita do Google é 10.000 unidades/dia (~100 buscas).

### Firebase (autenticação)

Necessário para login de usuários, salas permanentes e room locking.

1. Crie um app em [console.firebase.google.com](https://console.firebase.google.com)
2. Copie o SDK config JSON e stringifique: `JSON.stringify(config)`
3. Adicione ao `.env`:

```
VITE_FIREBASE_CONFIG={"apiKey":"..."}
FIREBASE_ADMIN_SDK_CONFIG={"type":"service_account",...}
```

### PostgreSQL (persistência de salas)

```
DATABASE_URL=postgres://user:pass@host:5432/dbname
```

Aplique o schema com `psql $DATABASE_URL < sql/schema.sql`.

### Virtual Browser

Para desenvolvimento local com Docker:

```bash
# Instale Docker
curl -fsSL https://get.docker.com | sh

# Inicie um neko de teste
npm run testvBrowser
```

Para pools gerenciados em produção, configure `VM_MANAGER_CONFIG` (formato: `provider:size:region:minSize:limitSize:hostname`).

### Redis (métricas — opcional)

```
REDIS_URL=redis://localhost:6379
```

## Build e produção

```bash
npm run build        # compila frontend + typecheck servidor
npm run pm2          # inicia com PM2 (shards + vmWorker)
npm run deploy       # pull da branch release + restart PM2
```

## Stack

- **Frontend**: React 18, TypeScript, Vite 7, Mantine v8
- **Backend**: Node 24, Express, Socket.IO
- **Banco**: PostgreSQL (salas), Redis (métricas)
- **Infra alvo**: OKE / OCI — manifests em `k8s/` (a definir)
