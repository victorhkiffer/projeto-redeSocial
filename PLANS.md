# Conecta Empreendedor

Este ExecPlan é um documento vivo. É um sistema de rede social B2B inspirado no LinkedIn.

## Purpose / Big Picture
O sistema tem como objetivo conectar empresas que precisam de serviços com empresas prestadoras, permitindo contato direto, negociação e avaliação da qualidade dos serviços realizados. A plataforma funcionará como uma rede de negócios (B2B).

Capacidades centrais (alto nível):
- Solicitar serviços
- Oferecer serviços
- Comunicação e negociação (inclui chat interno)
- Reputação e avaliações após a execução de serviços
- Divulgação de serviços via postagens (feed)

Objetivos do produto:
- Conectar empresas para prestação de serviços
- Facilitar comunicação e negociação entre empresas
- Criar um sistema de reputação baseado em avaliações reais
- Empresa que avalia constantemente serviços que foram prestados a ela ou tenham sido bem avaliadas sobem no ranking de recomendação quando uma pessoa pesquisa por determinado serviço
- Incentivar empresas ativas e bem avaliadas
- Permitir divulgação de serviços via postagens

## Progress
Estado operacional (atualize continuamente):

### Done
- [x] Definição da proposta do produto
- [x] Definição dos tipos de usuários
- [x] Definição das permissões de Empresa e Representante
- [x] Definição dos módulos principais do sistema
- [x] Definição inicial das regras de negócio
- [x] Definição da identidade visual
- [x] Estruturação inicial do planejamento do projeto
- [x] Modelagem do banco de dados (v1)
- [x] Definição das entidades principais (v1)
- [x] Definição dos relacionamentos entre entidades (v1)
- [x] Planejamento das telas principais (v1)
- [x] Escolha da stack tecnológica (v1)

### Doing
- [x] Configurar banco de dados (docker-compose + .env.example)
- [x] Especificar fluxos e critérios de aceite (auth, feed, serviços)
- [x] Definir contratos básicos de API (v1)

### Next
#### Fundação
- [x] Criar repositório Git (já existe, branch `main` com `origin/main`)
- [x] Configurar projeto React (Vite + React TS em `frontend/`)
- [x] Configurar banco de dados (subir localmente + validar migração)
- [ ] Configurar autenticação
- [x] Configurar sistema de rotas (React Router)
- [x] Criar layout principal (PublicLayout/AppLayout)
- [x] Implementar tema claro e escuro (toggle + CSS vars)

#### Empresas e Usuários
- [ ] Cadastro de empresa
- [ ] Login
- [ ] Logout
- [ ] Recuperação de senha
- [ ] Perfil da empresa
- [ ] Edição de perfil
- [ ] Upload de logo
- [ ] Cadastro de representantes
- [ ] Aprovação de representantes
- [ ] Remoção de representantes

#### Rede Social
- [ ] Criar postagem
- [ ] Feed de publicações
- [ ] Curtidas
- [ ] Comentários
- [ ] Sistema de seguir empresas
- [ ] Pesquisa de empresas

#### Serviços
- [ ] Cadastro de serviços
- [ ] Solicitação de serviços
- [ ] Aceitar proposta
- [ ] Rejeitar proposta
- [ ] Histórico de serviços
- [ ] Controle de status do serviço

#### Comunicação
- [ ] Chat entre empresas
- [ ] Histórico de mensagens
- [ ] Notificações
- [ ] Compartilhamento de arquivos

#### Reputação
- [ ] Sistema de avaliações
- [ ] Avaliação por estrelas
- [ ] Comentários de avaliação
- [ ] Média geral das empresas
- [ ] Ranking por categoria

#### Dashboard
- [ ] Estatísticas da empresa
- [ ] Serviços contratados
- [ ] Serviços prestados
- [ ] Histórico de avaliações
- [ ] Crescimento de conexões

## Surprises & Discoveries
- 2026-05-21: Ambiente atual não tem Node.js/NPM instalados (`node`/`npm` não reconhecidos). Isso bloqueia scaffold do React e dependências JS por enquanto.
- 2026-05-21: `docker compose up -d db` falhou porque o Docker daemon/engine não está acessível no ambiente (pipe `//./pipe/docker_engine` não encontrado). Validação do DB ficou pendente.
- 2026-05-21: Resolução Docker: iniciar `Docker Desktop.exe` habilitou o daemon (`docker info` ok) e permitiu subir o Postgres via compose.
- 2026-05-21: Resolução Node: instalado via `winget`. Em PowerShell, `npm` pode cair no `npm.ps1` (bloqueado por policy); usar `C:\\Program Files\\nodejs\\npm.cmd` (ou ajustar policy) evita o erro.

## Decision Log
- 2026-05-21: Banco de dados alvo: PostgreSQL (modelagem v1 em SQL). Chaves primárias `uuid`, timestamps `timestamptz`.
- 2026-05-21: Identidade de usuário: Representante autentica; ações ocorrem “em nome” de uma Empresa (representante pertence a uma empresa).
- 2026-05-21: Chat e follow são entre Empresas (não entre representantes).
- 2026-05-21: Frontend v1: Vite + React + TypeScript, rotas com React Router e UI base com Tailwind (darkMode por classe).

## Outcomes & Retrospective
Nada registrado.

## Context and Orientation

Visão geral de conceitos e modelagem (alto nível). Evite colocar backlog aqui.

### Perfis do Sistema
Tipos principais de usuário:
- Empresa
- Representante (funcionário vinculado à empresa)

#### Empresa
Usuário principal, representa a organização.

Permissões:
- Gerenciar perfil da empresa
- Aceitar/rejeitar representantes
- Publicar posts
- Contratar serviços
- Receber solicitações
- Avaliar outras empresas
- Acessar chat

#### Representante
Usuário vinculado a uma empresa.

Permissões:
- Contatar empresas (em nome da empresa)
- Participar de chats
- Comentar em postagens
- Visualizar informações

Restrições:
- Não pode conversar com representantes de outras empresas diretamente
- Não pode gerenciar empresa
- Depende de aprovação da empresa

### Módulos do Sistema
- Autenticação
- Dashboard
- Perfil da Empresa
- Representantes
- Postagens (Feed)
- Conexões ou Seguidores
- Chat
- Serviços ou Solicitações
- Avaliações (Ranking)

### Paleta de Cores
Modo Claro
- Primária: #22C55E
- Hover/destaque: #16A34A
- Fundo: #F8FAFC
- Texto: #0F172A
- Cinza secundário: #5e6c80

Modo Escuro
- Fundo: #0F172A
- Verde: #197e3e
- Branco: #F8FAFC
- Cinza: #94A3B8

## Plan of Work
Backlog estruturado por frentes de trabalho. Detalhe suficiente para execução contínua, sem virar documentação de arquitetura.

- Doing:
  - Infra local de banco (docker-compose) + env
  - Contratos mínimos de API (auth + feed + serviços)
  - Critérios de aceite (smoke + fluxos)
- Next:
  - Scaffold frontend (React + rotas + tema) quando Node estiver disponível
  - Scaffold backend (a definir conforme stack) e autenticação
  - Migrações iniciais e seed
- Later:
  - Chat, notificações, ranking e dashboard

## Concrete Steps
Comandos e passos operacionais repetíveis (setup, rodar, testes, migrações). Coloque comandos reais do projeto aqui.

- Setup:
  - Requisitos: Git, Docker Desktop (para PostgreSQL), Node.js (para frontend/backend JS)
  - Criar `.env` a partir de `.env.example`
- Rodar localmente:
  - `docker compose up -d db`
- Testes:
  - Smoke: subir DB e conectar via `psql` (ou cliente equivalente)
- Migrações/seed:
  - Aplicar SQL de `db/migrations` em ordem (v1 manual)
  - Exemplo (sem `psql` local): `docker exec conecta-db psql -U conecta -d conecta_empreendedor -f /tmp/0001_init.sql`

## Validation and Acceptance
Critérios de teste e aceite objetivos. Evite “como funciona”; foque em como validar.

- Smoke checklist:
  - [x] `docker compose up -d db` sobe sem erro
  - [x] Consegue conectar no PostgreSQL com credenciais do `.env` (via `docker exec ... psql`)
  - [x] Rodar `db/migrations/0001_init.sql` sem erro
- Critérios de aceite por fluxo:
  - Auth (v1): representante consegue criar conta, entrar, sair; representante PENDING não acessa rotas protegidas.
  - Feed (v1): empresa cria postagem; outra empresa vê no feed; curte e comenta.
  - Serviços (v1): empresa solicita serviço; prestadora envia proposta; solicitante aceita; após “concluído” ambos podem avaliar.
- Regressões importantes:
  - Integridade referencial: deletar empresa deve falhar se houver histórico relevante (serviços/avaliações)

## Idempotence and Recovery
Como repetir tarefas com segurança e como recuperar de falhas (ex.: reset de ambiente, reprocessamentos).

- Reset de ambiente:
  - `docker compose down -v` (apaga volume do DB local)
- Reexecução segura:
  - Recriar volume e reaplicar migrações em ordem
- Plano de rollback:
  - Recriar banco a partir de backup (futuro); por ora, reset local

## Artifacts and Notes
Logs, exemplos e notas úteis (cole aqui trechos curtos, links internos, outputs relevantes).

- Logs:
  - `node -v; npm -v` -> comandos não reconhecidos (ambiente sem Node.js)
  - `git status` -> `assets/` e `screens/` estavam como untracked; mantidos no repo
  - `git add -A` (fora do sandbox) necessário por permissão negada ao escrever em `.git/`
  - `docker --version` -> Docker CLI existe, mas erro de permissão ao ler `C:\\Users\\Pc\\.docker\\config.json`
  - `docker compose up -d db` -> falhou sem acesso ao daemon (`//./pipe/docker_engine`)
- Comandos (DB/validação):
  - Criar `.env`: `Copy-Item .\\.env.example .\\.env`
  - Iniciar Docker Desktop: `Start-Process \"C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe\"`
  - Verificar daemon: `docker info`
  - Subir DB: `docker compose up -d db`
  - Readiness: `docker exec -e PGPASSWORD=... conecta-db pg_isready -U conecta -d conecta_empreendedor`
  - Aplicar migração: `docker cp db/migrations/0001_init.sql conecta-db:/tmp/0001_init.sql` + `docker exec ... psql -f /tmp/0001_init.sql`
  - Listar tabelas: `docker exec ... psql -c \"\\dt\"`
- Comandos (frontend):
  - Instalar Node: `winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements`
  - Scaffold: `C:\\Program Files\\nodejs\\npm.cmd create vite@latest frontend -- --template react-ts`
  - Dependências: `C:\\Program Files\\nodejs\\npm.cmd install`
  - Rotas/Tema/UI: `C:\\Program Files\\nodejs\\npm.cmd install react-router-dom` + `C:\\Program Files\\nodejs\\npm.cmd install -D tailwindcss@3 postcss autoprefixer`
  - Build: `C:\\Program Files\\nodejs\\npm.cmd run build`
- Exemplos:
  - `docker compose up -d db`
  - Aplicar migração: `psql -f db/migrations/0001_init.sql ...` (cliente/conn string a definir)
  - Arquivos criados: `docker-compose.yml`, `.env.example`, `db/migrations/0001_init.sql`, `docs/screens.md`, `docs/stack.md`, `contracts/api-v1.md`
  - Commit: `00a5084` ("Add DB model v1 and infra docs")

## Interfaces and Dependencies
Dependências, integrações e contratos (internos/externos). Não confundir com “comandos” nem com “backlog”.

- Dependências runtime:
  - PostgreSQL (via Docker no dev)
  - Frontend: React + Vite
- Contratos e interfaces:
  - API HTTP (a definir em `contracts/`): Auth, Empresas, Feed, Serviços, Avaliações, Chat (futuro)
