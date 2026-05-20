# Deploy na Hostinger — Links Moove Hub

Guia para publicar o projeto no **hPanel** (Node.js Web App).

## Requisitos

- Plano Hostinger com **Node.js Web Apps** (Business Web, Cloud, etc.)
- Repositório Git (GitHub/GitLab) **ou** upload via Gerenciador de Arquivos / SSH
- Node.js **22.x** recomendado (mínimo 22.5 por causa do `node:sqlite`)

---

## 1. Preparar o repositório

Confirme na raiz do projeto:

| Arquivo | Função |
|---------|--------|
| `server.js` | Entrada da aplicação |
| `app.js` | Express + rotas |
| `package.json` | `"start": "node server.js"` |
| `public/` | `index.html`, `dashboard.html` |

**Não commite** `.env` nem `data/*.db`.

---

## 2. Criar aplicação Node no hPanel

1. **Websites** → **Add Website** → **Node.js Web App**
2. Conecte o repositório Git ou faça upload do projeto
3. Configuração:

| Campo | Valor |
|-------|--------|
| Node.js version | **22.x** |
| Root directory | `/` |
| Build command | `npm install` |
| Start command | `npm start` |
| Entry file | `server.js` (se solicitado) |

---

## 3. Variáveis de ambiente (hPanel)

Em **Environment variables** → **Import from .env file** ou adicione manualmente:

```env
NODE_ENV=production

ADMIN_USERNAME=admin
ADMIN_PASSWORD=sua_senha_forte_aqui

PUBLIC_URL=https://seu-dominio.com.br
GEOIP_LOCAL_FALLBACK=Região de Teste
TZ=America/Sao_Paulo
```

**Não defina `PORT`** — a Hostinger injeta automaticamente.

### Banco de dados

#### Opção A — SQLite (mais simples)

```env
DATABASE_URL=file:./data/links.db
```

- A pasta `data/` deve existir no projeto (já inclusa)
- Após o primeiro deploy, garanta permissão de escrita em `data/` (Gerenciador de Arquivos ou SSH: `chmod 755 data`)
- Faça backup periódico de `data/links.db`

#### Opção B — PostgreSQL (recomendado para produção)

1. **hPanel** → **Bancos de dados** → **PostgreSQL** → criar banco e usuário
2. Use a connection string exata do painel:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST:5432/NOME_DO_BANCO
DATABASE_SSL=true
```

3. Redeploy após salvar as variáveis

---

## 4. Deploy e domínio

1. Clique em **Deploy** e aguarde o build (`npm install`)
2. Vincule seu domínio em **Domains**
3. Ative **SSL** (HTTPS) no hPanel

---

## 5. Testar após o deploy

| URL | Esperado |
|-----|----------|
| `https://seu-dominio.com.br/` | Página de links |
| `https://seu-dominio.com.br/api/health` | JSON `{ "ok": true }` |
| `https://seu-dominio.com.br/dashboard` | Login Basic Auth → painel |
| `https://seu-dominio.com.br/admin` | Mesmo painel |

Credenciais do dashboard: `ADMIN_USERNAME` + `ADMIN_PASSWORD` do hPanel.

---

## 6. Deploy via SSH + PM2 (VPS / plano com SSH)

```bash
cd ~/domains/seu-dominio.com/public_html
git pull
npm install --production
pm2 restart links-moove-hub || pm2 start server.js --name links-moove-hub
pm2 save
```

Configure as mesmas variáveis no `.env` na pasta do app (nunca commite no Git).

---

## Checklist final

- [ ] `ADMIN_PASSWORD` forte definida no hPanel
- [ ] `NODE_ENV=production`
- [ ] `PUBLIC_URL` com `https://` e domínio correto
- [ ] `PORT` **não** definida manualmente
- [ ] Node 22.x selecionado
- [ ] SSL ativo
- [ ] `/api/health` responde OK
- [ ] Dashboard pede login e exibe dados após acessos na página de links

---

## Problemas comuns

| Sintoma | Solução |
|---------|---------|
| Build falha | Verifique Node 22+ e logs do build no hPanel |
| 503 no dashboard | Defina `ADMIN_PASSWORD` nas variáveis |
| Analytics vazio | Acesse a página de links para gerar eventos; confira `DATABASE_URL` |
| SQLite não grava | Permissão de escrita em `data/` |
| PostgreSQL erro SSL | Use `DATABASE_SSL=true` |
