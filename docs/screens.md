# Telas (v1)

Este documento descreve as telas principais para a primeira versão navegável (MVP), sem detalhar UI fina.

## Públicas
- Landing
- Login (Representante)
- Recuperação de senha
- Cadastro de empresa + representante “owner”

## Autenticadas (Representante)
- Feed
  - Criar postagem
  - Curtir / comentar
- Pesquisa
  - Buscar empresas por nome/categoria
  - Resultados + ranking (futuro; v1: ordenação simples)
- Perfil da empresa
  - Ver perfil + serviços + posts
  - Editar perfil (se autorizado)
  - Upload de logo (se autorizado)
- Representantes
  - Listar representantes
  - Aprovar/rejeitar (Empresa/Owner/Admin)
- Serviços
  - Catálogo de serviços (ofertas) da empresa
  - Solicitar serviço (criar request)
  - Propostas recebidas/enviadas
  - Job em andamento + histórico
- Avaliações
  - Avaliar após job concluído
  - Ver avaliações e média
- Chat
  - Lista de conversas (empresas)
  - Conversa + histórico
- Dashboard (v1 mínimo)
  - Cards simples: serviços em aberto, jobs em andamento, avaliações recentes

## Rotas sugeridas (exemplo)
- `/` landing
- `/login`, `/recuperar-senha`, `/cadastro`
- `/app/feed`
- `/app/pesquisa`
- `/app/empresa/:id`
- `/app/configuracoes/perfil`
- `/app/representantes`
- `/app/servicos`
- `/app/chat`
- `/app/avaliacoes`
- `/app/dashboard`
