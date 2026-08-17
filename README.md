# 3º LIGA LALOTEX DE FUTÊVOLEI

App web (mobile-first) para organizar o campeonato: 16 jogadores, 15 rodadas
semanais, sorteios, placares ao vivo e ranking individual. Frontend em
React + TypeScript + Vite; dados e autenticação em Firebase (Firestore +
Authentication), com atualização em tempo real para todos os jogadores.

Toda a regra de negócio foi portada 1:1 do protótipo HTML de referência
(`Dashboard_Circuito_Futevolei.html`) — ver `src/data/domain.ts`.

## Papéis de acesso

| Tela | Admin (logado) | Jogador (link público) |
|---|---|---|
| Visão Geral | vê e edita sorteio da temporada | só vê |
| Sorteios | vê | vê |
| Ranking | vê | vê |
| Detalhe da semana | edita placares, sorteia rodada/grupo, edita suplentes | só vê, tudo atualiza em tempo real |
| Jogadores | edita os 16 nomes | só consulta (campos desabilitados) |
| Login | login com e-mail/senha | não existe — acesso direto ao link |

Não há cadastro público: só existe **uma conta admin** (o organizador),
criada manualmente no Firebase Authentication.

## 1. Criar o projeto Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) e crie um projeto novo.
2. **Firestore Database** → criar banco → modo produção → escolha a região.
3. **Authentication** → Sign-in method → ative **E-mail/senha**.
4. Em **Authentication → Users**, adicione manualmente o usuário admin
   (e-mail + senha do organizador). Não use o cadastro público — crie direto pelo painel.
5. Em **Configurações do projeto → Seus apps**, crie um app da Web e copie
   as chaves do `firebaseConfig`.

## 2. Configurar o app localmente

```bash
npm install
cp .env.example .env
```

Preencha o `.env` com as chaves copiadas do passo 1 e com o e-mail do admin:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_ADMIN_EMAIL=admin@example.com
```

`VITE_ADMIN_EMAIL` só controla a interface (mostrar/esconder os campos de
edição). A segurança de verdade é imposta pelo Firestore — por isso o mesmo
e-mail precisa ser copiado também para `firestore.rules` (passo 3).

## 3. Regras de segurança do Firestore

Abra `firestore.rules` e troque o e-mail de exemplo pelo e-mail real da
conta admin (deve ser **idêntico** ao `VITE_ADMIN_EMAIL`):

```
request.auth.token.email == 'admin@example.com'
```

Publique as regras:

```bash
npm install -g firebase-tools   # se ainda não tiver
firebase login
firebase use --add               # selecione o projeto criado no passo 1
firebase deploy --only firestore:rules
```

Isso garante: **leitura pública** (qualquer pessoa com o link vê tudo, sem
login) e **escrita só para o admin autenticado**.

## 4. Rodar localmente

```bash
npm run dev
```

Abra a URL local, clique em **"Entrar como admin"** e faça login com a
conta criada no passo 1.

### Primeiro acesso (bootstrap dos dados)

Os documentos do Firestore são criados sob demanda, na primeira gravação:

- Vá em **Jogadores** e clique em **"Salvar jogadores"** uma vez (mesmo sem
  alterar nada) — isso cria `/config/season` com os 16 nomes iniciais.
- Ao sortear ou atribuir uma rodada em qualquer semana, o documento
  `/weeks/{semana}` correspondente é criado automaticamente.

Não é necessário nenhum script de seed separado.

## 5. Build e deploy

```bash
npm run build
```

### Opção A — Firebase Hosting

```bash
firebase deploy --only hosting
```

### Opção B — Vercel

```bash
npx vercel
```

Configure as mesmas variáveis `VITE_FIREBASE_*` e `VITE_ADMIN_EMAIL` no
painel do projeto na Vercel (Settings → Environment Variables), com
"Framework Preset" = Vite.

Depois do deploy você terá uma URL fixa — é esse link que vai para o grupo
do WhatsApp da liga. Todo mundo abre em modo leitura; só o organizador
precisa logar.

## Modelo de dados (Firestore)

```
/config/season
  { nome, players: string[16], dates: string[15] }   // dates é só espelho — o app usa a lista fixa do código

/weeks/{semana}      // documentos "1" a "15"
  {
    assignedRound: number | null,
    groupAssignment: { A: number[4], B: number[4] } | null,
    groupScores: { A: {h,a}[6], B: {h,a}[6] },
    knockout: { sfG1, sfG2, finalG, sfS1, sfS2, finalS },  // cada um {h,a}
    playerOverrides: { "<numJogador>": "nome do suplente" }
  }
```

As 15 rodadas fixas (`Sorteio nº 1 a 15`, seção 8.3 do briefing) e as 15
datas do calendário **não** ficam no Firestore — são constantes em
`src/data/fixedData.ts`, porque nunca mudam e não são editáveis pelo app
(exatamente como no protótipo de referência). O ranking e o status de cada
semana são sempre **derivados** desses dados na hora (`src/data/domain.ts`),
não ficam armazenados.

## Estrutura do projeto

```
src/
  data/          fixedData.ts (constantes da temporada), domain.ts (regras de negócio), types.ts
  firebase.ts    inicialização do Firebase (Auth + Firestore)
  context/       AuthContext (login admin), SeasonContext (dados em tempo real + gravações)
  components/    TopBar, SeasonStrip, telas (views/) e subcomponentes da rodada (round/)
firestore.rules  leitura pública / escrita só-admin
firebase.json    config de Hosting + Firestore
```

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — typecheck + build de produção (`dist/`)
- `npm run preview` — preview local do build
- `npm run lint` — oxlint
