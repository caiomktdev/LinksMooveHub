# Deploy na Hostinger — moovelinks.com.br

Guia para substituir o WordPress em **moovelinks.com.br** pelo projeto **Links Moove Hub** (Node.js + GitHub).

Repositório: https://github.com/caiomktdev/LinksMooveHub

---

## Importante: não use só o Gerenciador de Arquivos

O app Node.js da Hostinger **não roda dentro de `public_html`** como um site PHP/WordPress. Ele roda em ambiente Node separado (`/nodejs` no servidor).

Por isso, o caminho correto é:

1. **Remover** o site WordPress atual em `moovelinks.com.br`
2. **Criar** um novo **Node.js Web App** conectado ao GitHub
3. **Vincular** o domínio `moovelinks.com.br` ao novo app

Apagar só arquivos em `public_html` **não** coloca o Links Moove Hub no ar.

---

## Passo 1 — Backup (recomendado)

No hPanel → `moovelinks.com.br` → **Backups** → baixe um backup antes de remover o site WordPress.

---

## Passo 2 — Remover o site WordPress

1. **Sites** → localize **moovelinks.com.br**
2. Menu **⋯** (três pontos) ou **Detalhes do site** → **Remover site** / **Delete website**
3. Confirme a exclusão

O domínio continua na sua conta; apenas a hospedagem WordPress é removida.

> Se os bancos MySQL do WordPress já foram excluídos, ótimo. Caso ainda existam, em **Bancos de dados** → apague os que eram só do WordPress.

---

## Passo 3 — Criar Node.js Web App (GitHub)

1. **Sites** → **+ Adicionar site**
2. Escolha **Node.js Web App** (ou **Aplicação Node.js**)
3. **Importar repositório Git** → autorize o GitHub
4. Selecione: **`caiomktdev/LinksMooveHub`**
5. Branch: **`main`**

### Configuração de build

| Campo | Valor |
|-------|--------|
| Node.js | **22.x** |
| Framework | **Express.js** ou **Other** |
| Root directory | `/` |
| Build command | `npm install` |
| Start command | `npm start` |
| Entry file | `server.js` |
| Output directory | *(deixe vazio — app Express, não é build estático)* |

---

## Passo 4 — Domínio

Na etapa de domínio (ou depois em **Domains** do app):

- Selecione **`moovelinks.com.br`**

---

## Passo 5 — Variáveis de ambiente

**Environment variables** → cole ou importe:

```env
NODE_ENV=production

ADMIN_USERNAME=seu_email@exemplo.com
ADMIN_PASSWORD="sua_senha_com_#_se_precisar"

PUBLIC_URL=https://moovelinks.com.br
DATABASE_URL=file:./data/links.db
GEOIP_LOCAL_FALLBACK=Região de Teste
TZ=America/Sao_Paulo
```

**Não defina `PORT`** — a Hostinger injeta automaticamente.

---

## Passo 6 — Deploy

1. Clique em **Deploy**
2. Aguarde o build (`npm install` + `npm start`)
3. Verifique o log: deve aparecer `[db] sqlite conectado`
4. Ative/confirme **SSL** (HTTPS) para `moovelinks.com.br`

---

## Passo 7 — Testar

| URL | Esperado |
|-----|----------|
| https://moovelinks.com.br/ | Página de links Moove Hub |
| https://moovelinks.com.br/api/health | `{"ok":true,...}` |
| https://moovelinks.com.br/login | Tela de login do painel admin |
| https://moovelinks.com.br/dashboard | Analytics em tempo real (após login) |

Credenciais do painel: `ADMIN_USERNAME` + `ADMIN_PASSWORD` do hPanel.

---

## Atualizar o código após mudanças

```bash
git add .
git commit -m "sua alteração"
git push origin main
```

No painel do app Node.js → **Redeploy** (ou deploy automático se estiver ativo).

---

## Checklist

- [ ] Backup do WordPress baixado (opcional)
- [ ] Site WordPress **moovelinks.com.br** removido
- [ ] Node.js Web App criado com repo `LinksMooveHub`
- [ ] Domínio `moovelinks.com.br` vinculado
- [ ] `ADMIN_PASSWORD` definida
- [ ] `PUBLIC_URL=https://moovelinks.com.br`
- [ ] Deploy com sucesso
- [ ] HTTPS ativo
- [ ] Página e dashboard funcionando

---

## Problemas comuns

| Sintoma | Solução |
|---------|---------|
| Ainda aparece WordPress | Domínio ainda aponta para site antigo; remova o site WP e vincule ao app Node |
| **503 Service Unavailable** (página inteira) | O Node **não está rodando** — veja seção abaixo |
| Build falha | Use Node **22.x**; veja logs do deploy |
| 503 só no `/dashboard` (JSON) | Defina `ADMIN_PASSWORD` nas variáveis de ambiente |
| Pasta `data/` sem escrita | O app usa pasta temporária automaticamente; opcional: `DATA_DIR` no hPanel |

### Erro 503 — o deploy “deu certo” mas o site não abre

Isso significa: domínio OK, mas o processo Node **caiu** ou **não iniciou**.

1. **hPanel** → seu app Node → **Deployments** → abra o último deploy → leia o log de **runtime** / `stderr.log`
2. Procure por `[fatal]` ou `Cannot find module`
3. Confira no hPanel:

| Item | Valor correto |
|------|----------------|
| Node.js | **22.x** (recomendado) |
| Start command | `npm start` |
| Entry file | `server.js` |
| `PORT` | **não defina** (a Hostinger injeta) |
| `ADMIN_PASSWORD` | **obrigatório** em produção |
| `DATABASE_URL` | `file:./data/links.db` |

4. Clique em **Restart** (botão ao lado de “Running”)
5. Teste: https://moovelinks.com.br/api/health — deve retornar `{"ok":true,...}`

Se o log mostrar erro de SQLite/permissão, adicione:

```env
DATA_DIR=/tmp/linksmoovehub
```

e faça **Redeploy**.
